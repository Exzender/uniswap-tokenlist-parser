import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { bytecode20, bytecode223 } from './converter.json';
import { ethers } from 'ethers';

import schemaJson from './tokenlist.schema.json';
const ajv = new Ajv({ allErrors: true, verbose: true });

type uniToken = {
    chainId: number,
    address: string,
    symbol: string,
    name: string,
    decimals: number,
    logoURI?: string,
    tags?: string[],
    extensions?: object
}

type UniData = {
    name: string,
    version?: {
        major: number,
        minor: number,
        patch: number,
    },
    tokens: uniToken[],
    logoURI?: string
};

const ARBITRUM_LIST = 'https://bridge.arbitrum.io/token-list-42161.json';
const UNI_EXAMPLE_LIST =  'https://raw.githubusercontent.com/Uniswap/token-lists/refs/heads/main/test/schema/bigexample.tokenlist.json';
const ONE_INCH_LIST = 'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokens.1inch.eth.link';
const COIN_GECKO_LIST = 'https://tokens.coingecko.com/uniswap/all.json';

const CONVERTER_ADDRESS = '0x044845FB22B4258d83a6c24b2fB061AFEba7e5b9';

type dexToken = {
    chainId: number,
    symbol: string,
    name: string,
    decimals: number,
    logoURI?: string,
    isNative: boolean,
    isToken: boolean,
    address0: string,
    address1: string
}

type DexData = {
    name: string,
    version?: {
        major: number,
        minor: number,
        patch: number,
    },
    tokens: dexToken[],
    logoURI?: string
};

async function validate(data: any) {
    addFormats(ajv);
    const validator = ajv.compile(schemaJson);
    
    const valid = validator(data);
    
    if (valid) {
        return valid;
    }
    if (validator.errors) {
        throw validator.errors.map(error => {
            delete error.data;
            return error;
        })
    }
}

function calcAddress(tokenAddress: string, erc20source: boolean = true) {
    const _bytecode = erc20source ? bytecode223 : bytecode20;
    const create2Inputs = [
        '0xff',
        CONVERTER_ADDRESS,
        ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address'],[tokenAddress])),
        ethers.keccak256(_bytecode),
    ];
    const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join('')}`;
    return ethers.getAddress(`0x${ethers.keccak256(sanitizedInputs).slice(-40)}`);
}

function formatItem(token: uniToken, address223: string): dexToken {
    return {
        chainId: token.chainId,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI,
        isNative: false,
        isToken: true,
        address0: token.address,
        address1: address223
    } 
}

async function getList(url: string): Promise<UniData> {
    try {
        const response = await fetch(url);
        const data = await response.json();
        await validate(data);
        return data;
    } catch (e) {
        return <UniData>{};
    }
}

async function convertList(url: string): Promise<DexData> {
    const data = await getList(url);
    const list = data.tokens;

    if (list.length === 0) {
        console.error('No data found');
        return <DexData>{};
    }

    const convertedList: DexData = {
        name: data.name,
        tokens: [],
        logoURI: data.logoURI,
        version: data.version
    };

    console.time('parseList');
    for (let token of list) {
        const erc223address = calcAddress(token.address, true);
        const newItem = formatItem(token, erc223address);
        convertedList.tokens.push(newItem);
    }
    console.timeEnd('parseList');
    
    return convertedList;
}

(async () => {
    console.time('fullProcess');
    const resList = await convertList(COIN_GECKO_LIST);
    console.timeEnd('fullProcess');
    
    // console.dir(resList);
    console.log(`List length: ${resList.tokens.length}`);
})();
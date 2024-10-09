import {convertList, predictWrapperAddress} from "./convertTokenList";

const ARBITRUM_LIST = 'https://bridge.arbitrum.io/token-list-42161.json';
const UNI_EXAMPLE_LIST =  'https://raw.githubusercontent.com/Uniswap/token-lists/refs/heads/main/test/schema/bigexample.tokenlist.json';
const ONE_INCH_LIST = 'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokens.1inch.eth.link';
const COIN_GECKO_LIST = 'https://tokens.coingecko.com/uniswap/all.json';

(async () => {
    console.time('fullProcess');
    const resList = await convertList(UNI_EXAMPLE_LIST);
    const res = predictWrapperAddress('0xfff9976782d46cc05630d1f6ebab18b2324d6b14');
    console.log(res);
    console.timeEnd('fullProcess');

    // console.dir(resList);
    console.log(`List length: ${resList.tokens.length}`);
})();
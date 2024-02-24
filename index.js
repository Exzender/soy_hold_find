const path = require('path');
const fs = require('fs');
const { Web3 } = require('web3');
require('dotenv').config();

const ROUTER_ABI = require('./soy_finance_abi.json');
const SOY_ABI = require('./soy_abi.json');
const RPC = 'https://rpc.callisto.network/';

const ROUTER = '0xeb5b468faacc6bbdc14c4aacf0eec38abccc13e7'; // Soy Finance Router
const SOY_ADDRESS = '0x9FaE2529863bD691B4A7171bDfCf33C7ebB10a65';
const WCLO_ADDRESS = '0xF5AD6F6EDeC824C7fD54A66d241a227F6503aD3a';
const LAST_BLOCK = BigInt(process.env.ENDBLOCK || '14186359');
const FIRST_BLOCK = BigInt(process.env.STARTBLOCK || '0');
const BATCH_SIZE = BigInt(10000);

const EVENT_TRANSFER = 'Transfer';
const EVENT_SWAP = 'Swap';

const holders = new Map();

function addToHolder(address, value) {
    // console.log(`${address} -> ${value}`);
    let newVal = value;
    if (holders.has(address)) {
       newVal += holders.get(address);
    }
    holders.set(address, newVal);
}

// main ()
(async () => {
     // init Web3 provider
    const web3 = new Web3(RPC);
    const netId = await web3.eth.net.getId();
    console.log(`Connected to: ${netId}`);

    const fullBlocks = (LAST_BLOCK - FIRST_BLOCK);

    // router contract
    const contract = new web3.eth.Contract(
        ROUTER_ABI,
        ROUTER
    );

    // soy contract
    const contractSoy = new web3.eth.Contract(
        SOY_ABI,
        SOY_ADDRESS
    );

    const testPair = [WCLO_ADDRESS.toUpperCase(), SOY_ADDRESS.toUpperCase()];
    // const contracts = [ZERO_ADDRESS.toUpperCase(), FARM_ADDRESS.toUpperCase(), FARM2_ADDRESS.toUpperCase()];

    console.time('getEvents');
    let stopFlag = false;
    let count = 0;
    for (let i = FIRST_BLOCK; i < LAST_BLOCK; i += BATCH_SIZE) {
        const pcnt = Number(i - FIRST_BLOCK) / Number(fullBlocks) * 100;
        console.log(`block: ${i} -> ${pcnt}%`);
        console.time('getOneBatch');

        const lastBlock = (i + BATCH_SIZE - 1n) > LAST_BLOCK ? LAST_BLOCK : i + BATCH_SIZE - 1n;
        const events = await contract.getPastEvents(EVENT_SWAP, {
            fromBlock: i,
            toBlock: lastBlock
        });

        // parse SWAP
        if (events.length) {
            for (let event of events) {
                const user = event.returnValues['0'].toUpperCase();
                const tokenA = event.returnValues['1'].toUpperCase();
                const tokenB = event.returnValues['2'].toUpperCase();
                const val = BigInt(event.returnValues['3']);

                if (testPair.includes(tokenA) && testPair.includes(tokenB)) {
                    addToHolder(user, val);
                }
            }
        }

        const eventsSoy = await contractSoy.getPastEvents(EVENT_TRANSFER, {
            fromBlock: i,
            toBlock: lastBlock
        });

        // parse transfer SOY
        if (eventsSoy.length) {
            for (let event of eventsSoy) {
                const tokenA = event.returnValues['0'].toUpperCase();
                const val = BigInt(event.returnValues['2']);

                if (holders.has(tokenA)) {
                    addToHolder(tokenA, val * (-1n));
                }
            }
        }

        if (stopFlag) break;
        console.timeEnd('getOneBatch');
    }

    console.timeEnd('getEvents');

    let outStr = 'address;SOY wei;SOY ether\n';
    for (const [key, value] of holders) {
        if (value > 0n) {
            outStr += `${key.toLowerCase()};${value};${web3.utils.fromWei(value, 'ether')}\n`;
        }
    }

    // console.dir(holders);
    fs.writeFileSync(path.resolve(__dirname + '/out', 'soy_buyer.csv'), outStr, 'utf8');
})();
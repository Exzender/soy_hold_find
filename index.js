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
const OUT_FILE = process.env.OUT_FILE || 'soy_buyer.csv';

const EVENT_TRANSFER = 'Transfer';
const EVENT_SWAP = 'Swap';

const holders = new Map();
const transfers = new Map();

function addToHolder(address, value, transfer = false) {
    // console.log(`${address} -> ${value}`);
    const set = transfer ? transfers : holders;
    let newVal = value;
    if (set.has(address)) {
       newVal += set.get(address);
    }
    set.set(address, newVal);
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

    //
    const buyFile = 'soy_buy.csv';
    fs.writeFileSync(buyFile, '', 'utf8');
    fs.appendFileSync(buyFile,`address;value;tx_hash`);

    //
    const transferFile = 'soy_trans.csv';
    fs.writeFileSync(transferFile, '', 'utf8');
    fs.appendFileSync(transferFile,`from;to;value;tx_hash`);

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
                const val = BigInt(event.returnValues['4']);

                if (tokenA === testPair[0] && tokenB === testPair[1]) {
                    addToHolder(user, val);
                    fs.appendFileSync(buyFile,`\n${user};${val};${event.transactionHash}`);
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
                const tokenB = event.returnValues['1'].toUpperCase();
                const val = BigInt(event.returnValues['2']);

                // if (transfers.has(tokenA)) {
                if (holders.has(tokenA) || holders.has(tokenB)) {
                    addToHolder(tokenA, val * (-1n), true);
                    addToHolder(tokenB, val, true);
                    fs.appendFileSync(transferFile,`\n${tokenA};${tokenB};${val};${event.transactionHash}`);
                }
            }
        }

        if (stopFlag) break;
        console.timeEnd('getOneBatch');
    }

    console.timeEnd('getEvents');

    let outStr = 'address;SOY ether;buy;trans\n';
    for (const [key, value] of holders) {
        let resVal = value;
        let transVal = 0;

        if (transfers.has(key)) {
            transVal = transfers.get(key);
            resVal = transVal < value ? transVal : value;
        } else {
            continue;
        }

        if (resVal > 0n) {
            outStr += `${key.toLowerCase()};${web3.utils.fromWei(resVal, 'ether')};${web3.utils.fromWei(value, 'ether')};${web3.utils.fromWei(transVal, 'ether')}\n`;
        }
    }

    // console.dir(holders);
    const outFile = path.resolve(__dirname + `/${OUT_FILE}`);
    if (fs.existsSync(outFile)) {
        //
    } else {
        try {
            fs.mkdirSync(path.dirname(outFile));
        } catch (e) {
            console.log(`Error creating dir ${e.toString()}`);
        }
    }

    fs.writeFileSync(path.resolve(outFile), outStr, 'utf8');
})();
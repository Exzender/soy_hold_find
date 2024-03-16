const path = require('path');
const fs = require('fs');
const { Web3 } = require('web3');
require('dotenv').config();

const ROUTER_ABI = require('./soy_finance_abi.json');
const SOY_ABI = require('./soy_abi.json');
const readline = require("readline");
const RPC = 'https://rpc.callisto.network/';

const ROUTER = '0xeb5b468faacc6bbdc14c4aacf0eec38abccc13e7'; // Soy Finance Router

const SOY_ADDRESS = '0x9FaE2529863bD691B4A7171bDfCf33C7ebB10a65';
const tokenMap = new Map([
    ['0xf5ad6f6edec824c7fd54a66d241a227f6503ad3a', 'CLO'],
    ['0x1eaa43544daa399b87eecfcc6fa579d5ea4a6187', 'CLOE'],
    ['0xbf6c50889d3a620eb42c0f188b65ade90de958c4', 'BUSDT'],
    ['0xccde29903e621ca12df33bb0ad9d1add7261ace9', 'BNB'],
    ['0xcc208c32cc6919af5d8026dab7a3ec7a57cd1796', 'ETH'],
    ['0xccc766f97629a4e14b3af8c91ec54f0b5664a69f', 'ETC'],
    ['0xcc2d45f7fe1b8864a13f5d552345eb3f5a005fed', 'CAKE'],
    ['0xcc099e75152accda96d54fabaf6e333ca44ad86e', 'TWT'],
    ['0xccebb9f0ee6d720debccee42f52915037f774a70', 'WSG'],
    ['0xcc1530716a7ebecfdc7572edcbf01766f042155c', 'REEF'],
    ['0xccec9f26f52e8e0d1d88365004f4f475f5274279', 'BAKE'],
    ['0xcca4f2ed7fc093461c13f7f5d79870625329549a', 'SHIB'],
    ['0xcc8b04c0f7d0797b3bd6b7be8e0061ac0c3c0a9b', 'RACA'],
    ['0xcc10a4050917f771210407df7a4c048e8934332c', 'LINA'],
    ['0xcc50d400042177b9dab6bd31ede73ae8e1ed6f08', 'TON'],
    ['0xcc50ab63766660c6c1157b8d6a5d51cea82dff34', 'FTM'],
    ['0xcc99c6635fae4dacf967a3fc2913ab9fa2b349c3', 'BTT'],
    ['0x9f9b6dd3dedb4d2e6c679bcb8782f546400e9a53', 'VTT'],
    ['0xcc45afedd2065edca770801055d1e376473a871b', 'XMS'],
    ['0xcccac2f22752bbe77d4dab4e9421f2ac6c988427', 'BBT'],
    ['0xccd792f5d06b73685a1b54a32fe786346cad1894', 'ANTEX'],
    ['0xcc9afce1e164fc2b381a3a104909e2d9e52cfb5d', 'ZOO'],
    ['0xcc6e7e97a46b6f0ed3bc81518fc816da78f7cb65', 'BCOIN']
]);

const BOT_ADDRESS = ['0XFC8F3324B6D71D14BFD625ECDBD18F3BC29A9935', '0XD4CEC122526E8D9C4DE577AABA25C61BA12BCFDF',
    '0X8832ABCD7248ED2BD740D3EAFDEB774AB8332623', '0XF7D862D42976662D649CC356F4CA3854D595D53D',
    '0XC445BEA957B9263A204A874EB99A9529D38EB2D7', '0X11817FA65A9C2F68FC03BBBC9F2113D59B96908B',
    '0X51BCAC5EE7AE4BF5FFB409AE233222C9C00C0091'];
const EXCLUDE_CONTRACTS = [
    '0X2988009BB8F98A52C598E6A69576D3E024F50CAC', '0XF20E070F02F9CA1EED3A34D098F3DB15C0F36483',
    '0X1F68C7B973FC4DB362D5CDB213FAF1AB133E2D0F', '0X93AA120B5195337D71C1AF424B616C8ED5510305',
    '0X93026ECAED46D825989BBE298C7EE2B7CDC3C3A3', '0XCD449054CC333C211A4FE6078A014E86E9C61FDD',
    '0X56A455A29317B4813350221F07CC1A7D7EF5142B', '0XC676E76573267CC2E053BE8637BA71D6BA321195',
    '0X70F340045613F86D6C5CEB787B5DA28B765C2470', '0X27B7D8FC40B95E22D3C799A93AEEFE0FD60CF99D',
    '0X640048AB3CBBF580534FEF2BBA50D49F0399F12C', '0X1CEE27D0627CE8A81DF9B4D7EEE0D753B8C2F613',
    '0X23288A0A9C7AC3BEC523AEED146E4F0BF04D6309', '0XCE49B862ED38414C86914DF5E6D854AFBE203563',
    '0XE0A4D8356C0DED2E0E7A4AF6DB2A164F7D1AD243', '0X3006B056EA9423804084D6BA9080D6356EC78C10',
    '0X4309B1FFF68E4C46ABC9C92FB813CAFD1FC05A70', '0X7F342FED3A80EA475631196709D2C6C4A94816C8',
    '0XE92A69F2ACAAD1480EC945A60FBFDFB921436F51', '0X9A95F9CF7EA14264EF7AAC0798BBBE856246C0B2',
    '0X15BF7D259E0100247DEC1472686509B2DF458059', '0XB48829BFD203EDA5C259F7609AB5C1D83A88A47B',
    '0X4BF425F5B5BCB76E2B2E5E2A2EF0EF881D53A746', '0X365F4B80C427EFDD6F2F1D06FF08BC2E2FFCA832',
    '0XF344E4FC351B6BA97E6DF9DC03F6CCE824AE9FC2', '0X2831E574FE43F0815091596D0E7982D2707A954A',
    '0X6C1D9C58D5221DEDD8B5F4D1F53DED75A34D8858', '0X7BFBC45C60BFC6CDBF15AE3C79402DFD704124D8',
    '0X7A314519C7F9DD5CA8018C3491E6E9AA97CF67FC', '0X5FC4AA80CEDF18DFD1A1066FF0B02BB99DD09069',
    '0X7698AA8703623BB4BB149BB529E12AB712952E26', '0X03423DDB47730799C1250BFBD8A150E6D1D4BBBF',
    '0X0F663DA289ED5E76C1CF7730A317F89D28A0B9E3', '0X7C2DBD65342A472F053CEA6D7FF46CDC751BC6B8',
    '0XEB4511C90F9387DE8F8945ABD8C803D5CB275509', '0X31BFF88C6124E1622F81B3BA7ED219E5D78ABD98',
    '0X7D6C70B6561C31935E6B0DD77731FC63D5AC37F2', '0X346984A5A13241DAF2587571CE7D86CEA77BFB7E',
    '0XFF9289C2656CA1D194DEA1895AAF3278B744FA70', '0X86F7E2EF599690B64F0063B3F978EA6AE2814F63',
    '0X19DCB402162B6937A8ACEAC87ED6C05219C9BEF7', '0X19DCB402162B6937A8ACEAC87ED6C05219C9BEF7',
    '0X9A1FC8C0369D49F3040BF49C1490E7006657EA56',
    '0X1A3A72D2DE5416909BE91EC00ED811D9858DE39E',
    '0X8E06E06373408935AFB0765E72E0AE16C50264FD',
    '0XA447C295F8960A1158817F0617E47A66FFA7AC54',
    '0XFE85428FB7145BF17F7FBF7317BE091943CB70D5'
];

const LAST_BLOCK = BigInt(process.env.ENDBLOCK || '14186359');
const FIRST_BLOCK = BigInt(process.env.STARTBLOCK || '0');
const BATCH_SIZE = BigInt(10000);
const TEMP_CLEAR = Boolean(Number(process.env.TEMP_CLEAR)) || false;
const ONLY_FIRST_LEVEL = Boolean(Number(process.env.ONLY_FIRST_LEVEL)) || false;

const EVENT_TRANSFER = 'Transfer';
const EVENT_SWAP = 'Swap';
const NUM_LINKS = 5000; // exclude receivers with more than N links

const holders = new Map();
const receivers = new Map();
const sumByToken = new Map();
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

function addToReceiver(from, to) {
    // console.log(`${from} -> ${to}`);
    let rcvSet;
    if (receivers.has(to)) {
        rcvSet = receivers.get(to);
    } else {
        rcvSet = new Set();
    }
    rcvSet.add(from);
    receivers.set(to, rcvSet);

    // let sndSet;
    // if (receivers.has(from)) {
    //     sndSet = senders.get(from);
    // } else {
    //     sndSet = new Set();
    // }
    // sndSet.add(to);
    // senders.set(from, sndSet);
}

async function parseCSV(filePath, valueCol = 1) {
    const results = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    return new Promise((resolve, reject) => {
        // Event listener for each line in the CSV file
        rl.on('line', (line) => {
            const values = line.split(';');

            // Process each value as needed
            const val = Number(values[valueCol]);
            if (!isNaN(val)) {
                results.push(values);
            }
        });

        // Event listener when the file reading is complete
        rl.on('close', () => {
            // The CSV parsing is complete
            resolve(results);
        });

        // Event listener for errors during file reading
        fileStream.on('error', (error) => {
            // Handle errors during file reading
            reject(error);
        });
    });
}

// main ()
(async () => {
     // init Web3 provider
    const web3 = new Web3(RPC);

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

    // temp files
    const buyFile = path.resolve(__dirname + `/temp/soy_buy_temp.csv`);
    const transferFile = path.resolve(__dirname + `/temp/soy_trans_temp.csv`);
    const outFile = path.resolve(__dirname + `/out/soy_buyer.csv`);

    try {
        fs.mkdirSync(path.dirname(buyFile));
    } catch (e) {
        console.log(`Error creating dir ${e.toString()}`);
    }

    try {
        fs.mkdirSync(path.dirname(outFile));
    } catch (e) {
        console.log(`Error creating dir ${e.toString()}`);
    }

    let blockNum = 0n;
    let holdersBlock = 0n;
    const tempExists = fs.existsSync(buyFile);

    if (TEMP_CLEAR || !tempExists) { // erase data in temp files
        console.log(`Erasing temp files...`);
        fs.writeFileSync(buyFile, '', 'utf8');
        fs.appendFileSync(buyFile, `address;value;token;block`);
        fs.writeFileSync(transferFile, '', 'utf8');
        fs.appendFileSync(transferFile,`from;to;value;block`);
    } else {         // read data from temp files
        console.log('Reading previously collected DATA...');

        console.time('tempReading');
        // than exclude from holders transactions after latest transfers block (!)
        try {
            const transArray = await parseCSV(transferFile);
            console.log(`Got transfers from file: ${transArray.length}`);
            if (transArray.length) {
                blockNum = BigInt(transArray[transArray.length - 1][3]);
                for (let rec of transArray) {
                    addToHolder(rec[0], BigInt(rec[2]) * (-1n), true);
                    addToHolder(rec[1], BigInt(rec[2]), true);
                    if (!EXCLUDE_CONTRACTS.includes(rec[1])) {
                        addToReceiver(rec[0], rec[1]);
                    }
                }
            }
        } catch (e) {
            console.error(`Error reading file ${transferFile}`);
        }

        try {
            const buysArray = await parseCSV(buyFile);
            console.log(`Got Buys from file: ${buysArray.length}`);
            if (buysArray.length) {
                holdersBlock = BigInt(buysArray[buysArray.length - 1][3]);
                for (let rec of buysArray) {
                    const block = BigInt(rec[3]);
                    if (block <= blockNum && !BOT_ADDRESS.includes(rec[0])) {
                        const val = BigInt(rec[1]);
                        const sum = BigInt(sumByToken.get(rec[2]) || 0);
                        sumByToken.set(rec[2], sum + val);
                        addToHolder(rec[0], val);
                    }
                }
            }
        } catch (e) {
            console.error(`Error reading file ${buyFile}`);
        }

        console.timeEnd('tempReading');

        blockNum += 1n;
        console.log(`Restarting from ${blockNum} block...`);
    }

    let firstBlock = FIRST_BLOCK > blockNum ? FIRST_BLOCK : blockNum;
    const fullBlocks = (LAST_BLOCK - firstBlock);

    const soyAddressUpper = SOY_ADDRESS.toUpperCase();
    const tokensArray = [];
    for (let key of tokenMap.keys()) {
        tokensArray.push(key.toUpperCase());
    }

    console.time('getEvents');
    let stopFlag = false;
    for (let i = firstBlock; i < LAST_BLOCK; i += BATCH_SIZE) {
        const pcnt = Number(i - firstBlock) / Number(fullBlocks) * 100;
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

                if (tokensArray.includes(tokenA) && tokenB === soyAddressUpper && !BOT_ADDRESS.includes(user)) {
                    addToHolder(user, val);
                    if (event.blockNumber > holdersBlock) {
                        const token = tokenMap.get(tokenA.toLowerCase());
                        const sum = BigInt(sumByToken.get(token) || 0);
                        sumByToken.set(token, sum + val);
                        fs.appendFileSync(buyFile, `\n${user};${val};${token};${event.blockNumber}`);
                    }
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
                    if (!EXCLUDE_CONTRACTS.includes(tokenB)) {
                        addToReceiver(tokenA, tokenB);
                    }
                    fs.appendFileSync(transferFile,`\n${tokenA};${tokenB};${val};${event.blockNumber}`);
                }
            }
        }

        if (stopFlag) break;
        console.timeEnd('getOneBatch');
    }

    console.timeEnd('getEvents');

    console.log('Resulting BUY sums by Tokens:');
    for (let [key, value] of sumByToken) {
        console.log(`[${key}]: ${web3.utils.fromWei(value, 'ether')}`);
    }

    // exclude from receivers who have > NUM_LINKS senders (export them)
    const outFileLinks = path.resolve(__dirname + `/out/soy_links.csv`);
    let outStr = 'address;num_senders\n';
    for (const [key, value] of receivers) {
        if (value.size > NUM_LINKS) {
            receivers.delete(key);
            outStr += `${key};${value.size}\n`;
        }
    }
    fs.writeFileSync(outFileLinks, outStr, 'utf8');


    // walk over receivers
    // get receiver, get its senders
    // sum buys of senders, sum all transfers - compare
    // remove senders from holders list
    // write in comment list of buy addresses
    outStr = 'address;SOY;bought;moved;num senders;senders\n';

    if (!ONLY_FIRST_LEVEL) {
        for (const [key, senders] of receivers) {

            let sumBuys = 0n;
            if (transfers.has(key)) {
                let sumTransfers = transfers.get(key);

                let comment = '[ ';
                let splitter = '';
                let counter = 0;

                for (let sender of senders.values()) {
                    if (holders.has(sender)) {
                        comment += `${splitter}${sender.toLowerCase()}`;
                        counter++;
                        splitter = ' / ';
                        sumBuys += holders.get(sender) || 0n;
                        sumTransfers += transfers.get(sender) || 0n;
                        holders.delete(sender);
                        transfers.delete(sender);
                    }
                }
                comment += ' ]';

                const resVal = sumBuys < sumTransfers ? sumBuys : sumTransfers;

                if (resVal > 0n) {
                    outStr += `${key.toLowerCase()};${web3.utils.fromWei(resVal, 'ether')};${web3.utils.fromWei(sumBuys, 'ether')};${web3.utils.fromWei(sumTransfers, 'ether')};${counter};${comment}\n`;
                }
            }
        }
    }

    // export holders without external transfers
    for (const [key, value] of holders) {
        let resVal = value;
        let transVal = 0;

        if (transfers.has(key)) {5
            transVal = transfers.get(key);
            resVal = transVal < value ? transVal : value;
        } else {
            continue;
        }

        if (resVal > 0n) {
            outStr += `${key.toLowerCase()};${web3.utils.fromWei(resVal, 'ether')};${web3.utils.fromWei(value, 'ether')};${web3.utils.fromWei(transVal, 'ether')};0;\n`;
        }
    }

    fs.writeFileSync(outFile, outStr, 'utf8');

})();
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const RPC_URL = 'https://rpc-gel.inkonchain.com';
const CONTRACT_ADDRESS = '0x9F500d075118272B3564ac6Ef2c70a9067Fd2d3F';
const ABI = [
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" } ], "name": "GM", "type": "event" },
  { "inputs": [], "name": "gm", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "recipient", "type": "address" } ], "name": "gmTo", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "user", "type": "address" } ], "name": "lastGM", "outputs": [ { "internalType": "uint256", "name": "lastGM", "type": "uint256" } ], "stateMutability": "view", "type": "function" }
];

const web3 = new Web3(RPC_URL);
const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
const privateKeyFile = path.join(__dirname, 'private_keys.txt');
const DEFAULT_RECIPIENT = '0xF85767d6DC933e0110702146aa592D3f980a1CA4';

function log(message, level = 'info') {
  const timestamp = chalk.gray(`[${new Date().toISOString()}]`);
  switch (level) {
    case 'success':
      console.log(`${timestamp} ${chalk.green(message)}`);
      break;
    case 'error':
      console.error(`${timestamp} ${chalk.red(message)}`);
      break;
    case 'warn':
      console.warn(`${timestamp} ${chalk.yellow(message)}`);
      break;
    default:
      console.log(`${timestamp} ${message}`);
  }
}

async function sendTransaction(tx, privateKey, retries = 3) {
  try {
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  } catch (error) {
    if (retries > 0) {
      log(`Transaction failed, retrying... (${3 - retries} retries left)`, 'warn');
      return sendTransaction(tx, privateKey, retries - 1);
    } else {
      throw new Error(`Transaction failed after multiple retries: ${error.message}`);
    }
  }
}

async function executeGM() {
  // Load private keys from file
  const privateKeys = fs.readFileSync(privateKeyFile, 'utf-8')
    .split('\n')
    .map(pk => pk.trim()) // Trim whitespace from each line
    .filter(Boolean); // Remove empty lines

  const accounts = privateKeys.map(pk => web3.eth.accounts.privateKeyToAccount(pk));

  while (true) {
    // Fetch lastGM timestamps for all wallets
    const lastGMTimestamps = await Promise.all(
      accounts.map(acc => contract.methods.lastGM(acc.address).call().then(Number))
    );

    // Convert to local time and calculate next GM time
    const nextGMs = lastGMTimestamps.map((ts, index) => {
      const localTime = new Date(ts * 1000);
      const nextTime = new Date(localTime.getTime() + 24 * 60 * 60 * 1000 + 60 * 1000); // Add 1 minute extra
      return { address: accounts[index].address, nextGMTime: nextTime };
    });

    // Sort by nearest execution time
    nextGMs.sort((a, b) => a.nextGMTime - b.nextGMTime);

    // Execute GM transactions
    for (let i = 0; i < accounts.length; i++) {
      const sender = accounts[i];
      const recipient = accounts.length > 1
        ? accounts[(i + 1) % accounts.length].address // Cycle through addresses
        : DEFAULT_RECIPIENT; // Use default recipient if only one wallet

      const now = new Date();
      const nextGM = nextGMs.find(item => item.address === sender.address);

      if (!nextGM) {
        log(`No next GM time found for ${sender.address}`, 'warn');
        continue;
      }

      const nextGMTime = nextGM.nextGMTime;

      if (now >= nextGMTime) {
        try {
          const tx = {
            to: CONTRACT_ADDRESS,
            data: contract.methods.gmTo(recipient).encodeABI(),
            gas: await contract.methods.gmTo(recipient).estimateGas({ from: sender.address })
          };

          const receipt = await sendTransaction(tx, sender.privateKey);
          log(`GM transaction successful: ${sender.address} GM to ${recipient}, TX Hash: ${receipt.transactionHash}`, 'success');
		  await new Promise(resolve => setTimeout(resolve, 10000)); // Add 10-second delay
        } catch (error) {
          log(`Failed to send GM transaction for ${sender.address} GM to ${recipient}: ${error.message}`, 'error');
        }
      } else {
        log(`Skipping ${sender.address}, next GM time is ${nextGMTime}`, 'info');
      }
    }

    // Determine the nearest next GM time and calculate delay
    const now = new Date();
    const nearestNextGM = nextGMs.reduce((nearest, gm) => {
	  if (gm.nextGMTime > now && (!nearest || gm.nextGMTime < nearest)) {
		return gm.nextGMTime;
	  }
	  return nearest;
	}, null);

    const delay = nearestNextGM - now;

    if (isFinite(delay)) {
      log(`Next execution in ${Math.ceil(delay / 1000)} seconds`, 'info');
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      log(`No future GM transactions scheduled. Rechecking in 60 seconds.`, 'warn');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Recheck in 60 seconds
    }
  }
}
// Function to print header
function printHeader() {
    const line = "=".repeat(50);
    const title = "Auto Daily GM";
    const createdBy = "Bot created by: https://t.me/airdropwithmeh";

    const totalWidth = 50;
    const titlePadding = Math.floor((totalWidth - title.length) / 2);
    const createdByPadding = Math.floor((totalWidth - createdBy.length) / 2);

    const centeredTitle = title.padStart(titlePadding + title.length).padEnd(totalWidth);
    const centeredCreatedBy = createdBy.padStart(createdByPadding + createdBy.length).padEnd(totalWidth);

    console.log(chalk.cyan.bold(line));
    console.log(chalk.cyan.bold(centeredTitle));
    console.log(chalk.green(centeredCreatedBy));
    console.log(chalk.cyan.bold(line));
}
printHeader();
executeGM().catch(error => log(error.message, 'error'));


# GM Scheduler

This is a Node.js-based application for automating GM (Good Morning) transactions using Web3.

## Features

- **Automated GM Transactions**: Schedules and executes GM transactions based on the `lastGM` timestamp of wallet addresses.
- **Dynamic Scheduling**: Rechecks the nearest next GM execution time and schedules the process accordingly.
- **GM to Next Wallet Address**: Automatically cycles through wallet addresses for GM transactions. For example:
  - Wallet 1 sends GM to Wallet 2.
  - Wallet 2 sends GM to Wallet 3.
  - Wallet 3 sends GM to Wallet 1 (if it's the last wallet).
- **Retry Mechanism**: Retries transactions up to three times if they fail.
- **Logging**: Provides detailed logs with timestamps for successful, skipped, and failed transactions.
- **Custom Delay**: Adds a 10-second delay after each successful transaction to ensure proper spacing between transactions.

## Installation

### Prerequisites

1. [Node.js](https://nodejs.org/) (version 14 or higher)
2. [npm](https://www.npmjs.com/)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/ganjsmoke/auto-gm-ink.git
   cd auto-gm-ink
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `private_keys.txt` file in the root directory of the project. Each line in the file should contain one private key.


### Running the Application

Run the script with the following command:
```bash
node index.js
```

The script will continuously execute GM transactions based on the wallet `lastGM` timestamps and dynamically schedule the next execution.

## Notes

- Ensure your private keys are stored securely in the `private_keys.txt` file and do not share this file with others.
- Make sure the wallets have sufficient funds to pay for gas fees.
- The script logs all activity, including successful transactions, skipped addresses, and errors.

## Example Log Output

```plaintext
[2025-01-27T03:38:15.607Z] GM transaction successful: 0xYourWallet GM to 0xRecipient, TX Hash: 0xTransactionHash
[2025-01-27T03:38:15.608Z] Skipping 0xYourOtherWallet, next GM time is Tue Jan 28 2025 10:30:32 GMT+0700 (Western Indonesia Time)
[2025-01-27T03:38:15.609Z] Next execution in 3600 seconds
```

## License

This project is open-source and available for use and modification.

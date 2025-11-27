<div align="center">
  <a href="https://youtu.be/cIZlnmUcFeo">
    <img src="https://img.youtube.com/vi/cIZlnmUcFeo/hqdefault.jpg" alt="Watch the tutorial">
  </a>
</div>

# Batching Transactions from 1Shot API Server Wallets

1Shot API allows you to perform multiple actions in a single transaction through batching. Batching is enabled by automatically upgrading server wallets to MetaMask Smart Wallets on supported networks. 

This example shows you how to use the 1Shot API typescript sdk to perform batched transactions with 1Shot API server wallets. 

## Setup

1. Make a free [1Shot API](https://1shotapi.com) account.
2. Go to the [API Keys](https://app.1shotapi.com/api-keys) tab and generate a new API key and secret.
3. Provision a Base Sepolia server wallet on the [wallets tab](https://app.1shotapi.com/wallets) and [deposit a small amount of native token](https://docs.base.org/base-chain/tools/network-faucets) to cover transaction gas ($1 will do hundreds of txs).
4. Deposit a small amount of [Base Sepolia USDC](https://faucet.circle.com/) into your new 1Shot API server wallet.
5. Clone this repo and `cd ./typescript/batch-txs` then `cp .env.example .env`.
6. Input your 1Shot API key and secret as well as your business id (located at the top right corner of the 1Shot API dashboard) into the `.env` file

## Running the Delegation Example

Once you have completed the setup steps, install dependencies:

```sh
npm install
```

Now you can run the example:

```sh
npm run build
npm run start
```

You should see some output like this: 

```sh
Chain id:  84532
1Shot Wallet: {
  type: 0,
  ticker: 'ETH',
  chainId: 84532,
  tokenAddress: '',
  accountAddress: '0xfa781aaa39de86ed1354e6a93c69b6896569ac6b',
  balance: '0.000999862599380089',
  decimals: 18
}
USDC approve method id: 06782cb2-f76c-49ed-8406-5a5ad36f1751
USDC transfer method id: d7014424-1833-43ab-b11f-05d944c02a72
1Shot API tx id: 7e807deb-580a-4457-a9d1-a20e2b419112
```

You can now visit the [transaction history](https://app.1shotapi.com/transaction-history) page to view the status of you batch transaction.
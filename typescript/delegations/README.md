<div align="center">
  <a href="https://youtu.be/hQp-UVfDQz0">
    <img src="https://img.youtube.com/vi/hQp-UVfDQz0/hqdefault.jpg" alt="Watch the tutorial">
  </a>
</div>

# Sponsored Delegation with MetaMask Smart Wallet

This example shows you how to set up sponsored delegations using the MetaMask Delegation Toolkit and 1Shot API. 1Shot API lets you store user delegations so they can be retrieved on-demand when needed. Additionally, 1Shot API makes delegation execution simple using `executeAsDelegator` which automatically prepares the target function call, finds a compatible delegation, and routes the transaction through the Delegation Manager contract for you. 

In this example, you'll upgrade an EOA to a MetaMask Smart Wallet and execute a sponsored function call in a single transaction. This gives you a great deal of flexibility and gas efficiency when constructing user flows in your product.

## Setup

1. Make a free [1Shot API](https://1shotapi.com) account.
2. Go to the [API Keys](https://app.1shotapi.com/api-keys) tab and generate a new API key and secret.
3. Provision an Optimism server wallet on the [wallets tab](https://app.1shotapi.com/wallets) and deposit a small amount of native token to cover transaction gas ($1 will do hundreds of txs).
4. Clone this repo and `cd ./typescript/delegations` then `cp .env.example .env`.
5. Input your 1Shot API key and secret as well as your business id (located at the top right corner of the 1Shot API dashboard) into the `.env` file
6. Put a private key into the `.env` file (it doesn't need any funds, txs will be sponsored by your 1Shot API server wallet)

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
1Shot Wallets: {
  type: 0,
  ticker: 'ARB',
  chainId: 42161,
  tokenAddress: '',
  accountAddress: '0x99f05136636c3800d417ecc6b7daf5e2e699e6e2',
  balance: '0.001834003882069',
  decimals: 18
}
Viem account address: 0x9fEad8B19C044C2f404dac38B925Ea16ADaa2954
signedDelegation: {
  delegate: '0x99f05136636c3800d417ecc6b7daf5e2e699e6e2',
  delegator: '0x9fEad8B19C044C2f404dac38B925Ea16ADaa2954',
  authority: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
  caveats: [
    {
      enforcer: '0x7F20f61b1f09b08D970938F6fa563634d65c4EeB',
      terms: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      args: '0x'
    },
    {
      enforcer: '0x2c21fD0Cb9DC8445CB3fb0DC5E7Bb0Aca01842B5',
      terms: '0x095ea7b3',
      args: '0x'
    }
  ],
  salt: '0x',
  signature: '0x86a7a460f9d3b46570b3b4b0f3e19d3adc3556e36542db6abb5fdd86e64b5c4c54c663222c9bb18a4a451323b77654083c1d647ef4dd72049f29b52c0c74ea491c'
}
signedAuthorization: {
  address: '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b',
  chainId: 42161,
  nonce: 4,
  signature: '0x90ff6850277c4dd4ec3594b784f501bd99772a1f0828a8212253fcb7b0b715895fbe562892f70e5c50bdba9cad144ecd5d222c02d6f020b087bbf9d2011c43301c'
}
1Shot API tx id: a225db64-e3ef-4cc2-9909-9a7c1e6d8038
```

This shows you the structure of the raw delegation and authorization objects so you can get a feel for what is being stored and relayed by 1Shot API.
import "dotenv/config";
import { OneShotClient } from "@uxly/1shot-client";
import { ethers } from "ethers";
import {
  Implementation,
  createDelegation,
  toMetaMaskSmartAccount,
  getDeleGatorEnvironment,
} from "@metamask/delegation-toolkit";
import { createCaveatBuilder } from "@metamask/delegation-toolkit/utils";
import { sepolia as chain } from "viem/chains";
import { serializeSignature, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Load required variables
const ONESHOT_KEY = requireEnv("ONESHOT_KEY");
const ONESHOT_SECRET = requireEnv("ONESHOT_SECRET");
const ONESHOT_BIZ_ID = requireEnv("ONESHOT_BIZ_ID");
const PRIVATE_KEY = requireEnv("PRIVATE_KEY");
const CONTRACT_METHOD_ID = requireEnv("CONTRACT_METHOD_ID");
const STATELESS_DELGATOR = "0x63c0c19a282a1b52b07dd5a65b58948a07dae32b"; // same on every chain

// Initialize the 1Shot API client
const oneshotClient = new OneShotClient({
  apiKey: ONESHOT_KEY,
  apiSecret: ONESHOT_SECRET,
  baseUrl: "https://api.1shotapi.dev/v0",
});

// Ensure there is a Linea Network server wallet for this business for delegation relaying
const oneshotWallet = await oneshotClient.wallets.list(ONESHOT_BIZ_ID, {
  chainId: chain.id, // Linea Mainnet
});
if (oneshotWallet.response.length === 0) {
  throw new Error(
    "No 1Shot Wallet found for this business on Linea Mainnet, please create one in the 1Shot dashboard & fund with Linea ETH."
  );
}
const oneshotRelayerAddress: `0x${string}` = oneshotWallet.response[0]
  .accountBalanceDetails?.accountAddress as `0x${string}`;
console.log("1Shot Wallets:", oneshotWallet.response[0].accountBalanceDetails);

// Setup a viem account from the private key
const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
const viemWalletClient = createWalletClient({
  account,
  chain: chain,
  transport: http(),
});
const smartAccount = await toMetaMaskSmartAccount({
  client: viemWalletClient as any, // TODO: this requires casting as any but it shouldn't
  implementation: Implementation.Stateless7702,
  address: account.address,
  signer: { walletClient: viemWalletClient },
});
console.log("Viem account address:", account.address);

// Step 1: create ans sign a delegation
// USDC address on Linea.
const caveats = [
  {
    type: "limitedCalls",
    limit: 1,
  },
];

// const USDC_ADDRESS = "0x176211869ca2b568f2a7d4ee941e073a821ee1ff"; // USDC on Linea
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC on Sepolia

const delegation = createDelegation({
  scope: {
    type: "functionCall",
    targets: [USDC_ADDRESS],
    selectors: ["approve(address, uint256)"],
  },
  to: oneshotRelayerAddress,
  from: account.address,
  environment: getDeleGatorEnvironment(chain.id),
});

const delegationSignature = await smartAccount.signDelegation({ delegation });
const signedDelegation = {
  ...delegation,
  signature: delegationSignature,
};
console.log("signedDelegation:", signedDelegation);

// store the delegation in 1Shot API
const storedDelegation = await oneshotClient.wallets.createDelegation(
    oneshotWallet.response[0].id,
    {
        delegationData: JSON.stringify(signedDelegation),
        contractAddresses: [USDC_ADDRESS],
    }
);

// Step 2: create and sign the 7702 authorization

const authorization = await viemWalletClient.prepareAuthorization({
  contractAddress: STATELESS_DELGATOR,
  executor: undefined, // the authorization will be executed by the 1Shot API server wallet
});
const authorizationSignature = serializeSignature(
  await viemWalletClient.signAuthorization(authorization)
);
const signedAuthorization = {
    ...authorization,
    signature: authorizationSignature,
}
console.log("signedAuthorization:", signedAuthorization);

// Step 3: Upgrade the EOA to a smart wallet and execute a function call in a single transaction

const tx = await oneshotClient.contractMethods.executeAsDelegator(
    CONTRACT_METHOD_ID,
    account.address as string, // delegator address
    {
        "spender": oneshotRelayerAddress,
        "value": "0"
    },
    {
        memo: "DelegationToolkit Test",
        authorizationList: [
            signedAuthorization
        ],
    }
);
console.log("tx:", tx);

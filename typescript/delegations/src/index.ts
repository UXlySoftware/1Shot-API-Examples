import "dotenv/config";
import { OneShotClient } from "@uxly/1shot-client";
import {
  Implementation,
  createDelegation,
  toMetaMaskSmartAccount,
  getDeleGatorEnvironment,
} from "@metamask/delegation-toolkit";
import { optimism as chain } from "viem/chains";
import { serializeSignature, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Load required environment variables
const ONESHOT_KEY = requireEnv("ONESHOT_KEY");
const ONESHOT_SECRET = requireEnv("ONESHOT_SECRET");
const ONESHOT_BIZ_ID = requireEnv("ONESHOT_BIZ_ID");
const PRIVATE_KEY = requireEnv("PRIVATE_KEY");
const STATELESS_DELGATOR = "0x63c0c19a282a1b52b07dd5a65b58948a07dae32b"; // same on every chain

// Constants (you don't need to change these)
const USDC_ADDRESS = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"; // USDC on Optimism
const ONESHOT_USDC_PROMPT_ID = "56e1f682-9864-4ba1-bafc-332647af7822";

// Initialize the 1Shot API client
// We only initialize this here so that we can easily check we have a 1Shot API server 
// wallet provisioned and can access the server wallet's address so that we can delegate to it.
const oneshotClient = new OneShotClient({
  apiKey: ONESHOT_KEY,
  apiSecret: ONESHOT_SECRET
});

// Ensure there is a Optimism Network server wallet for this business for delegation sponsorship
// IMPORTANT: To run this example, the server wallet must have enough gas funds for the tx
const oneshotWallet = await oneshotClient.wallets.list(ONESHOT_BIZ_ID, {
  chainId: chain.id, // Optimism Mainnet
});
if (oneshotWallet.response.length === 0) {
  throw new Error(
    "No 1Shot Wallet found for this business on Optimism Mainnet, please create one in the 1Shot dashboard & fund with Optimism ETH."
  );
}

const oneshotRelayerAddress: `0x${string}` = oneshotWallet.response[0]
  .accountBalanceDetails?.accountAddress as `0x${string}`;
console.log("1Shot Wallets:", oneshotWallet.response[0].accountBalanceDetails);

// **********************************************************
// "Client-Side" actions: Creating and signing a delegation and
// EIP-7702 authorization happen client-side in your dApp
// **********************************************************

// Setup a viem account from the private key
const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
const viemWalletClient = createWalletClient({
  account,
  chain: chain,
  transport: http(),
});

// Prepare and sign an EIP-7702 authorization so that the user's EOA can be 
// upgraded to a MetaMask Smart Account 
const authorization = await viemWalletClient.prepareAuthorization({
  contractAddress: STATELESS_DELGATOR,
  executor: undefined, // the authorization will be executed/sponsored by the 1Shot API server wallet
});
const authorizationSignature = serializeSignature(
  await viemWalletClient.signAuthorization(authorization)
);
const signedAuthorization = {
    ...authorization,
    signature: authorizationSignature,
}
console.log("signedAuthorization:", signedAuthorization);

// We need cast the viem wallet client as a MetaMask Smart Account so that we can sign the delegation
const smartAccount = await toMetaMaskSmartAccount({
  client: viemWalletClient as any, // TODO: this requires casting as any but it shouldn't
  implementation: Implementation.Stateless7702,
  address: account.address,
  signer: { walletClient: viemWalletClient },
});
console.log("Viem account address:", account.address);

// Create a EIP-7715 delegation to allow the 1Shot API server wallet to act on behalf of the user
// This simple delegation illustrates how to give the 1Shot API server wallet permission to call 
// approve() on the user's USDC

// Additional optional caveats to limit the scope of the delegation
const caveats = [
  {
    type: "limitedCalls",
    limit: 1,
  },
];

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

// **********************************************************
// "Server-Side" actions: These actions would be performed 
// server-side by your business logic. Simultaneously, we
// upgrade the user's EOA to a MetaMask Smart Account on Optimism
// and call approve() on the user's USDC funds.
// **********************************************************
// store the delegation in 1Shot API
const storedDelegation = await oneshotClient.wallets.createDelegation(
    oneshotWallet.response[0].id, // link the delegation to the 1Shot API server wallet
    {
        delegationData: JSON.stringify(signedDelegation),
        contractAddresses: [USDC_ADDRESS],
    }
);

// Assure we have Optimism USDC contract methods imported into our 1Shot API account so that we
// can call its methods in a delegated transaction
const USDCMethods = await oneshotClient.contractMethods.assureContractMethodsFromPrompt(
    ONESHOT_BIZ_ID,
    {
        chainId: chain.id,
        contractAddress: USDC_ADDRESS,
        walletId: oneshotWallet.response[0].id,
        promptId: ONESHOT_USDC_PROMPT_ID
    }
)
// find the contract method id assocaited with the "approve" method
const approveMethod = USDCMethods.find(m => m.name === "approve");

// In a single transaction, upgrade the user's EOA to a MM Smart Account on LInea 
// and execute an approve() call on the user's USDC funds
const tx = await oneshotClient.contractMethods.executeAsDelegator(
    approveMethod!.id,
    account.address as string, // delegator address (i.e. the user's EOA address)
    {
        "spender": oneshotRelayerAddress,
        "value": "0"
    },
    {
        memo: "DelegationToolkit Test",
        authorizationList: [
            {
                address: signedAuthorization.address as string,
                nonce: signedAuthorization.nonce.toString(),
                chainId: signedAuthorization.chainId,
                signature: signedAuthorization.signature,
            }
        ],
    }
);
console.log("1Shot API tx id:", tx!.id);



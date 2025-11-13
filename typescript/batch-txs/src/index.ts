import "dotenv/config";
import { OneShotClient, ExecuteBatchContractMethod } from "@uxly/1shot-client";

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
const chainId = Number(requireEnv("CHAIN_ID"));

// Constants (you don't need to change these)
const USDC_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701"; // USDC on Optimism
const ONESHOT_USDC_PROMPT_ID = "3fde2e56-acdf-48e2-a854-b55bfa45021c"; // 1Shot API prompt id for Optimism USDC contract methods

// Initialize the 1Shot API client
// We only initialize this here so that we can easily check we have a 1Shot API server 
// wallet provisioned and can access the server wallet's address so that we can delegate to it.
const oneshotClient = new OneShotClient({
  apiKey: ONESHOT_KEY,
  apiSecret: ONESHOT_SECRET
});

// Ensure there is a Optimism Network server wallet for this business for delegation sponsorship
// IMPORTANT: To run this example, the server wallet must have enough gas funds for the tx
console.log("Chain id: ", chainId);
const oneshotWallet = await oneshotClient.wallets.list(ONESHOT_BIZ_ID, {
  chainId: chainId, 
});
if (oneshotWallet.response.length === 0) {
  throw new Error(
    "No 1Shot Wallet found for this business on target chain, please create one in the 1Shot dashboard & add gas funds."
  );
}

// print out the 1Shot Wallet address 
const oneshotRelayerAddress: `0x${string}` = oneshotWallet.response[0]
  .accountBalanceDetails?.accountAddress as `0x${string}`;
console.log("1Shot Wallet:", oneshotWallet.response[0].accountBalanceDetails);

// Assure we have Optimism USDC contract methods imported into our 1Shot API account so that we
// can call its methods in a delegated transaction
const USDCMethods = await oneshotClient.contractMethods.assureContractMethodsFromPrompt(
    ONESHOT_BIZ_ID,
    {
        chainId: chainId,
        contractAddress: USDC_ADDRESS,
        walletId: oneshotWallet.response[0].id,
        promptId: ONESHOT_USDC_PROMPT_ID
    }
)
// find the contract method id associated with the "approve" method
const approveMethod = USDCMethods.find(m => m.name === "approve");
console.log("USDC approve method id:", approveMethod!.id);

// find the contract method id associated with the "transfer" method
const transferMethod = USDCMethods.find(m => m.name === "transfer");
console.log("USDC transfer method id:", transferMethod!.id);

// In a single transaction, upgrade the user's server wallet to a MM Smart Account
// and execute an approve() then a transfer() on the USDC contract,
const tx = await oneshotClient.contractMethods.executeBatch({
  walletId: oneshotWallet.response[0].id,
  contractMethods: [
    {
      params: {
        "spender": oneshotWallet.response[0].accountBalanceDetails?.accountAddress,
        "value": "10000"
      },
      contractMethodId: approveMethod!.id,
      executionIndex: 0
    },
    {
      params: {
        "to": oneshotWallet.response[0].accountBalanceDetails?.accountAddress,
        "value": "10000"
      },
      contractMethodId: transferMethod!.id,
      executionIndex: 0
    },
  ],
  memo: "Batch Approve and Transfer Test",
})

console.log("1Shot API tx id:", tx!.id);



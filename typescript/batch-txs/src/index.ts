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
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // USDC on Base Sepolia
const ONESHOT_USDC_PROMPT_ID = "db6a751f-550f-419f-96d2-7a0ef30cd222"; // 1Shot API prompt id for Base Sepolia USDC contract methods

// Initialize the 1Shot API client
// We only initialize this here so that we can easily check we have a 1Shot API server 
// wallet provisioned and can access the server wallet's address so that we can delegate to it.
const oneshotClient = new OneShotClient({
  apiKey: ONESHOT_KEY,
  apiSecret: ONESHOT_SECRET,
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

// Assure we have Base Sepolia USDC contract methods imported into our 1Shot API account so that we
// can call its methods in a batch transaction
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

// First we'll see how to execute approve() and transfer() as separate txs so we 
// can compare the overall gas cost to the batched transaction
const tx1 = await oneshotClient.contractMethods.execute(
  approveMethod!.id,
  {
    "spender": oneshotWallet.response[0].accountBalanceDetails?.accountAddress,
    "value": "10000"
  },
  {
    memo: "Single Action Approve Test",
  }
)

const tx2 = await oneshotClient.contractMethods.execute(
  transferMethod!.id,
  {
    "to": oneshotWallet.response[0].accountBalanceDetails?.accountAddress,
    "value": "10000"
  },
  {
    memo: "Single Action Transfer Test",
  }
)

// Finally, in a single transaction, upgrade the user's server wallet to a MM Smart Account
// and execute an approve() then a transfer() on the USDC contract,
const tx3 = await oneshotClient.contractMethods.executeBatch({
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
      executionIndex: 1
    },
  ],
  memo: "Batch Approve and Transfer Test",
})

console.log("1Shot API approve tx id:", tx1!.id);
console.log("1Shot API transfer tx id:", tx2!.id);
console.log("1Shot API batch tx id:", tx3!.id);
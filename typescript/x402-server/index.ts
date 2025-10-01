import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, type SolanaAddress } from "x402-express";
import { createFacilitatorConfig } from "@1shotapi/x402-facilitator";
config();

const facilitatorConfig = createFacilitatorConfig(
  process.env.ONESHOT_API_KEY!,
  process.env.ONESHOT_API_SECRET!,
);

const payTo = process.env.ADDRESS as `0x${string}` | SolanaAddress;

const app = express();

app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /weather": {
        // USDC amount in dollars
        price: "$0.001",
        // network: "base" // uncomment for Base mainnet
        network: "base-sepolia",
      },
      "/premium/*": {
        // Define atomic amounts in any EIP-3009 token
        price: {
          amount: "100000",
          asset: {
            address: "0x9fead8b19c044c2f404dac38b925ea16adaa2954",
            decimals: 18,
            eip712: {
              name: "USDC",
              version: "2",
            },
          },
        },
        // network: "base" // uncomment for Base mainnet
        network: "base-sepolia",
      },
    },
    facilitatorConfig,
  ),
);

app.get("/weather", (req, res) => {
  res.send({
    report: {
      weather: "sunny",
      temperature: 70,
    },
  });
});

app.get("/premium/content", (req, res) => {
  res.send({
    content: "This is premium content",
  });
});

app.listen(4021, () => {
  console.log(`Server listening at http://localhost:${4021}`);
});

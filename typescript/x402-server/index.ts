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
        config: {
          description: "Access to weather data",
          mimeType: "application/json",
        },
      },
      "/premium/*": {
        // Define atomic amounts in any EIP-3009 token
        price: {
          amount: "1000",
          asset: {
            address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
            decimals: 6,
            eip712: {
              name: "USD Coin ",
              version: "2",
            },
          },
        },
        config: {
          description: "Access to premium content",
          mimeType: "application/json",
        },
        // network: "base" // uncomment for Base mainnet
        network: "polygon",
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

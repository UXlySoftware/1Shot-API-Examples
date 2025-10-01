import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, Resource, type SolanaAddress } from "x402-express";
import { facilitator, createFacilitatorConfig } from "@1shotapi/x402-facilitator";
config();

const facilitatorConfig = createFacilitatorConfig(
  "fJwkHW/LweTf33odtReAesNzdEztLyWG",
  "k5T0++DMDLrD621o1hfRLaXk53fyYq2I",
);

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}` | SolanaAddress;

if (!facilitatorUrl || !payTo) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const app = express();

app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /weather": {
        // USDC amount in dollars
        price: "$0.001",
        // network: "base" // uncomment for Base mainnet
        // network: "solana" // uncomment for Solana mainnet
        network: "sepolia",
      },
      "/premium/*": {
        // Define atomic amounts in any EIP-3009 token
        price: {
          amount: "100000",
          asset: {
            address: "0x9fead8b19c044c2f404dac38b925ea16adaa2954",
            decimals: 18,
            // omit eip712 for Solana
            eip712: {
);

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}` | SolanaAddress;

              name: "USDC",
              version: "2",
            },
          },
        },
        // network: "base" // uncomment for Base mainnet
        // network: "solana" // uncomment for Solana mainnet
        network: "sepolia",
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

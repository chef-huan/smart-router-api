import express from "express";
import * as dotenv from "dotenv";
import { getPairsV2Combined, getAllPairsStableSwap } from "./service/pairs";
import { getPairPriceV2 } from "./service/onchain/price";

dotenv.config();

const app = express();
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// parse application/json
app.use(express.json());

//TODO add body validation
app.post("/check-price", async (req, res) => {
  // try {
  //   const pairs = await getAllPairsStableSwap();
  // } catch (error) {
  //   console.log(`Error STABLE_SWAP`, error);
  // }

  // try {
  //   const pairs = await getAllPairsV2();
  // } catch (error) {
  //   console.log(`Error PAIRS`, error);
  // }

  try {
    const poorPairs = await getPairsV2Combined();
    await getPairPriceV2(poorPairs);
  } catch (error) {
    console.log(`Error SF`, error);
  }

  res.status(200).json({ message: "done" });
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`listening on port ${process.env.PORT || 8080}`);
});

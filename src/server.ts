import express from 'express';
import * as dotenv from 'dotenv';
import { getPairsV2Combined, getAllPairsStableSwap } from './strategyV2/service/pairs';
import { getPairPriceV2, getPairsPriceStableSwap } from './strategyV2/service/onchain';
import { getBestRoute } from './strategyV1';
import { QuoteRequest } from './common/model';
import { getRouteAndType } from './strategyV1/service/getRouteAndType';

dotenv.config();

const app = express();
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// parse application/json
app.use(express.json());

//TODO add body validation
app.post('/v2/check-price', async (req, res) => {
  try {
    const pairs = await getAllPairsStableSwap();
    const pairsWithPrice = await getPairsPriceStableSwap(pairs);
    console.log(pairsWithPrice[0]);
  } catch (error) {
    console.log(`Error STABLE_SWAP`, error);
  }

  try {
    const pairs = await getPairsV2Combined();
    const pairsWithPrice = await getPairPriceV2(pairs);
    console.log(pairsWithPrice[0]);
  } catch (error) {
    console.log(`Error SF`, error);
  }

  res.status(200).json({ message: 'done' });
});

//TODO add body validation
app.post('/v1/check-price', async (req, res) => {
  const request: QuoteRequest = JSON.parse(JSON.stringify(req.body));
  const response = await getBestRoute(request);
  res.status(200).json(response);
});

//TODO add body validation
app.post('/v1/check-trade', async (req, res) => {
  const request: QuoteRequest = JSON.parse(JSON.stringify(req.body));
  const response = await getRouteAndType(request);
  res.status(200).json(response);
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`listening on port ${process.env.PORT || 8080}`);
});

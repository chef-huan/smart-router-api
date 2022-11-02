import { CurrencyAmount } from "@pancakeswap/sdk";

import { fromSdkPair, QuoteRequest } from "../common/model";
import { getBestRouteFromV2 } from "./service/getAmmPrice";
import { getRoutWithStableSwap, Result } from "./service/getRoutWithStableSwap";
import { getAllPairsStableSwap } from "../common/service/stableSwapPairs";

export const getBestRoute = async (request: QuoteRequest): Promise<Result> => {
  const bestRouteV2 = await getBestRouteFromV2(request);
  console.log(bestRouteV2.inputAmount.numerator.toString());

  const stableSwapPairs = await getAllPairsStableSwap();
  const bestStableSwap = await getRoutWithStableSwap(
    bestRouteV2.route.pairs,
    stableSwapPairs,
    request.networkId,
    bestRouteV2.inputAmount.numerator.toString(),
  );

  const bestStableSwapAmount = CurrencyAmount.fromRawAmount(bestRouteV2.outputAmount.currency, bestStableSwap.outputAmountWei);
  if (bestStableSwapAmount.lessThan(bestRouteV2.outputAmount)) {
    return {
      outputAmountWei: bestRouteV2.outputAmount.numerator.toString(),
      pairs: bestRouteV2.route.pairs.map((pair) => fromSdkPair(pair)),
    };
  } else {
    return bestStableSwap;
  }
};

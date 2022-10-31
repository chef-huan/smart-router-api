import { fromSdkPair, QuoteRequest } from "../common/model";
import { getBestRouteFromV2 } from "./service/getAmmPrice";
import { getRoutWithStableSwap, Result } from "./service/getRoutWithStableSwap";
import { getAllPairsStableSwap } from "../common/service/stableSwapPairs";
import { FixedNumber } from "ethers";

export const getBestRoute = async (request: QuoteRequest): Promise<Result> => {
  const bestRouteV2 = await getBestRouteFromV2(request);
  console.log(bestRouteV2.inputAmount.numerator.toString());

  const stableSwapPairs = await getAllPairsStableSwap();
  const bestStableSwap = await getRoutWithStableSwap(
    bestRouteV2.route.pairs,
    stableSwapPairs,
    request.networkId,
    bestRouteV2.inputAmount.numerator.toString()
  );

  if (
    FixedNumber.from(bestRouteV2.outputAmount.numerator.toString()) >
    FixedNumber.from(bestStableSwap.outputAmountWei)
  ) {
    return {
      outputAmountWei: bestRouteV2.outputAmount.numerator.toString(),
      pairs: bestRouteV2.route.pairs.map((pair) => fromSdkPair(pair)),
    };
  } else {
    return bestStableSwap;
  }
};

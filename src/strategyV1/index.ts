import { Pair } from "@pancakeswap/sdk";

import { fromSdkPair, PairType, QuoteRequest } from "../common/model";
import { getBestRouteFromV2 } from "./service/getAmmPrice";
import { Result } from "./service/getRoutWithStableSwap";
import { getAllPairsStableSwapRefactor, isStableSwapPair } from "../common/service/stableSwapPairs";
import { getTradeWithStableSwap } from "./service/getTradeWithStableSwap";

export async function getBestRoute(request: QuoteRequest): Promise<Result> {
  const { networkId: chainId } = request;
  // FIXME seems the chain id is not used when getting the best route from v2
  const bestTradeV2 = await getBestRouteFromV2(request);
  const serializedBestRoute = bestTradeV2.route.pairs
    .map((pair: Pair) => `${pair.token0.symbol}-${pair.token1.symbol}`)
    .join(" ");
  console.log(serializedBestRoute);

  const stableSwapPairs = await getAllPairsStableSwapRefactor(chainId);
  const {
    pairs: pairsWithStableSwap,
    outputAmount: outputAmountWithStableSwap,
  } = await getTradeWithStableSwap(chainId, bestTradeV2, stableSwapPairs);

  // If stable swap is not as good as best trade got from v2, then use v2
  if (outputAmountWithStableSwap.lessThan(bestTradeV2.outputAmount)) {
    return {
      outputAmountWei: bestTradeV2.outputAmount.quotient.toString(),
      pairs: bestTradeV2.route.pairs.map((pair) => fromSdkPair(pair)),
    };
  }

  return {
    outputAmountWei: outputAmountWithStableSwap.quotient.toString(),
    pairs: pairsWithStableSwap.map((pair) => {
      const formatted = fromSdkPair(pair);
      if (!isStableSwapPair(pair)) {
        return formatted;
      }
      return {
        ...formatted,
        id: pair.stableSwapAddress,
        type: PairType.STABLE_SWAP,
      };
    }),
  };
}

import { Pair as SdkPair } from '@pancakeswap/sdk';
import { fromSdkPair, fromSdkTokens, Pair, QuoteRequest } from '../../common/model';
import { RouteType } from '../../common/model/routeType';
import { getBestRouteFromV2 } from './getAmmPrice';
import {
  getAllPairsStableSwapRefactor,
  StableSwapPair,
} from '../../common/service/stableSwapPairs';
import { findStableSwapPair } from '../utils/pair';
import { findTokenInConfig } from '../../common/service/token';

export const getRouteAndType = async (
  request: QuoteRequest,
): Promise<{ pairs: Pair[]; type: RouteType }> => {
  const tokenIn = findTokenInConfig(request.baseToken);
  const tokenOut = findTokenInConfig(request.quoteToken);

  const stableSwapPairs: StableSwapPair[] = await getAllPairsStableSwapRefactor(request.networkId);

  const index = stableSwapPairs.findIndex((pair) => {
    return pair.involvesToken(tokenIn) && pair.involvesToken(tokenOut);
  });

  if (index < 0) {
    return { type: RouteType.STABLE_SWAP, pairs: [fromSdkTokens(tokenIn, tokenOut)] };
  }

  const { route } = await getBestRouteFromV2(request);
  const bestRoutePairs: SdkPair[] = route.pairs;

  const combinePairs: Pair[] = [];
  let routeType = RouteType.V2;
  for (let i = 0; i < bestRoutePairs.length; i++) {
    const pair = findStableSwapPair(stableSwapPairs, bestRoutePairs[i]);
    if (pair) {
      routeType = RouteType.MIXED;
      combinePairs.push(fromSdkPair(pair));
    } else {
      combinePairs.push(fromSdkPair(bestRoutePairs[i]));
    }
  }

  return { type: routeType, pairs: combinePairs };
};

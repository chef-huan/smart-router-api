import { Pair } from '@pancakeswap/sdk';
import { StableSwapPair } from '../../common/service/stableSwapPairs';

export function includesPair(pairs: Pair[], pair: Pair) {
  return pairs.some((p) => isSamePair(p, pair));
}

export function isSamePair(one: Pair, another: Pair) {
  return another.involvesToken(one.token0) && another.involvesToken(one.token1);
}

export const findStableSwapPair = (stableSwapPairs: StableSwapPair[], pair: Pair) =>
  stableSwapPairs.find((p) => isSamePair(p, pair));

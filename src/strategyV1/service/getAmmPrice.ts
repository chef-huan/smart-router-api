/* eslint-disable no-param-reassign */
import { isTradeBetter } from "../utils/trades";
import {
  ChainId,
  Currency,
  CurrencyAmount,
  Pair,
  Token,
  Trade,
  TradeType,
} from "@pancakeswap/sdk";
import { flatMap } from "lodash";
import {
  ADDITIONAL_BASES,
  BASES_TO_CHECK_TRADES_AGAINST,
  BETTER_TRADE_LESS_HOPS_THRESHOLD,
  CUSTOM_BASES,
} from "../config";
import { getPairs, PairState } from "../utils/getPairs";
import { wrappedCurrency } from "../utils/wrappedCurrency";

// import { useUnsupportedTokens, useWarningTokens } from "./Tokens";

export async function getAllCommonPairs(
  currencyA?: Currency,
  currencyB?: Currency
): Promise<Pair[]> {
  const chainId = 56;

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined];

  const common = BASES_TO_CHECK_TRADES_AGAINST[chainId] ?? [];
  const additionalA = tokenA
    ? ADDITIONAL_BASES[chainId]?.[tokenA.address] ?? []
    : [];
  const additionalB = tokenB
    ? ADDITIONAL_BASES[chainId]?.[tokenB.address] ?? []
    : [];

  const bases: Token[] = [...common, ...additionalA, ...additionalB];

  const basePairs: [Token, Token][] = flatMap(bases, (base): [Token, Token][] =>
    bases.map((otherBase) => [base, otherBase])
  );

  const allPairCombinations = getAllPairCombinations(
    tokenA,
    tokenB,
    bases,
    basePairs,
    chainId
  );

  const allPairs = await getPairs(allPairCombinations, chainId);

  // only pass along valid pairs, non-duplicated pairs
  return Object.values(
    allPairs
      // filter out invalid pairs
      .filter((result): result is [PairState.EXISTS, Pair] =>
        Boolean(result[0] === PairState.EXISTS && result[1])
      )
      // filter out duplicated pairs
      .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
        memo[curr.liquidityToken.address] =
          memo[curr.liquidityToken.address] ?? curr;
        return memo;
      }, {})
  );
}

const getAllPairCombinations = (
  tokenA: Token | undefined,
  tokenB: Token | undefined,
  bases: Token[],
  basePairs: [Token, Token][],
  chainId: ChainId
): [Token, Token][] => {
  return tokenA && tokenB
    ? [
        // the direct pair
        [tokenA, tokenB],
        // token A against all bases
        ...bases.map((base): [Token, Token] => [tokenA, base]),
        // token B against all bases
        ...bases.map((base): [Token, Token] => [tokenB, base]),
        // each base against all bases
        ...basePairs,
      ]
        .filter((tokens): tokens is [Token, Token] =>
          Boolean(tokens[0] && tokens[1])
        )
        .filter(([t0, t1]) => t0.address !== t1.address)
        .filter(([tokenA_, tokenB_]) => {
          if (!chainId) return true;
          const customBases = CUSTOM_BASES[chainId];

          const customBasesA: Token[] | undefined =
            customBases?.[tokenA_.address];
          const customBasesB: Token[] | undefined =
            customBases?.[tokenB_.address];

          if (!customBasesA && !customBasesB) return true;

          if (
            customBasesA &&
            !customBasesA.find((base) => tokenB_.equals(base))
          )
            return false;
          if (
            customBasesB &&
            !customBasesB.find((base) => tokenA_.equals(base))
          )
            return false;

          return true;
        })
    : [];
};

const MAX_HOPS = 3;

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export async function getTradeExactIn(
  currencyAmountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency,
  singleHopOnly?: boolean
): Promise<Trade<Currency, Currency, TradeType> | null> {
  const allowedPairs = await getAllCommonPairs(
    currencyAmountIn?.currency,
    currencyOut
  );

  if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
    if (singleHopOnly) {
      return (
        Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, {
          maxHops: 1,
          maxNumResults: 1,
        })[0] ?? null
      );
    }
    // search through trades with varying hops, find best trade out of them
    let bestTradeSoFar: Trade<Currency, Currency, TradeType> | null = null;
    for (let i = 1; i <= MAX_HOPS; i++) {
      const currentTrade: Trade<Currency, Currency, TradeType> | null =
        Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, {
          maxHops: i,
          maxNumResults: 1,
        })[0] ?? null;
      // if current trade is best yet, save it
      if (
        isTradeBetter(
          bestTradeSoFar,
          currentTrade,
          BETTER_TRADE_LESS_HOPS_THRESHOLD
        )
      ) {
        bestTradeSoFar = currentTrade;
      }
    }
    return bestTradeSoFar;
  }
  return null;
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export async function getTradeExactOut(
  currencyIn?: Currency,
  currencyAmountOut?: CurrencyAmount<Currency>,
  singleHopOnly?: boolean
): Promise<Trade<Currency, Currency, TradeType> | null> {
  const allowedPairs = await getAllCommonPairs(
    currencyIn,
    currencyAmountOut?.currency
  );

  if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
    if (singleHopOnly) {
      return (
        Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, {
          maxHops: 1,
          maxNumResults: 1,
        })[0] ?? null
      );
    }
    // search through trades with varying hops, find best trade out of them
    let bestTradeSoFar: Trade<Currency, Currency, TradeType> | null = null;
    for (let i = 1; i <= MAX_HOPS; i++) {
      const currentTrade =
        Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, {
          maxHops: i,
          maxNumResults: 1,
        })[0] ?? null;
      if (
        isTradeBetter(
          bestTradeSoFar,
          currentTrade,
          BETTER_TRADE_LESS_HOPS_THRESHOLD
        )
      ) {
        bestTradeSoFar = currentTrade;
      }
    }
    return bestTradeSoFar;
  }
  return null;
}

// export function useIsTransactionUnsupported(
//   currencyIn?: Currency,
//   currencyOut?: Currency
// ): boolean {
//   const unsupportedTokens: { [address: string]: Token } =
//     useUnsupportedTokens();
//   const chainId = 56;
//
//   const tokenIn = wrappedCurrency(currencyIn, chainId);
//   const tokenOut = wrappedCurrency(currencyOut, chainId);
//
//   // if unsupported list loaded & either token on list, mark as unsupported
//   if (unsupportedTokens) {
//     if (tokenIn && Object.keys(unsupportedTokens).includes(tokenIn.address)) {
//       return true;
//     }
//     if (tokenOut && Object.keys(unsupportedTokens).includes(tokenOut.address)) {
//       return true;
//     }
//   }
//
//   return false;
// }

// export function useIsTransactionWarning(
//   currencyIn?: Currency,
//   currencyOut?: Currency
// ): boolean {
//   const unsupportedTokens: { [address: string]: Token } = useWarningTokens();
//   const chainId = 56;
//
//   const tokenIn = wrappedCurrency(currencyIn, chainId);
//   const tokenOut = wrappedCurrency(currencyOut, chainId);
//
//   // if unsupported list loaded & either token on list, mark as unsupported
//   if (unsupportedTokens) {
//     if (tokenIn && Object.keys(unsupportedTokens).includes(tokenIn.address)) {
//       return true;
//     }
//     if (tokenOut && Object.keys(unsupportedTokens).includes(tokenOut.address)) {
//       return true;
//     }
//   }
//
//   return false;
// }

import { Pair as SdkPair, Token as SdkToken } from "@pancakeswap/sdk";
import { fromSdkPair, Pair, QuoteRequest } from "../../common/model";
import { getBestRouteFromV2, isPairsEquals } from "../index";
import { getPairPriceStableSwap } from "../../strategyV2/service/onchain";
import { equalsIgnoreCase } from "../../common/utils/helpers";

export type Result = {
  outputAmountWei: string;
  pairs: Pair[];
};

export const getRoutWithStableSwap = async (
  bestRoutePairs: SdkPair[],
  stableSwapPairs: Pair[],
  network: number,
  inputAmountWei: string
): Promise<Result> => {
  const rout = bestRoutePairs
    .map((pair: SdkPair) => `${pair.token0.symbol}-${pair.token1.symbol}`)
    .join(" ");
  console.log(rout);

  const combinePairs: Pair[] = [];
  let outputAmountWei = inputAmountWei;
  let lastStableSwapIndex = -1;
  for (let i = 0; i < bestRoutePairs.length; i++) {
    for (let j = 0; j < stableSwapPairs.length; j++) {
      const pair: Pair = stableSwapPairs[j];
      if (isPairsEquals(bestRoutePairs[i], pair)) {
        console.log(
          `pair found index: ${i}, lastStableSwapIndex: ${lastStableSwapIndex}`
        );
        combinePairs.push(pair);

        let tokenIn: SdkToken = null,
          tokenOut: SdkToken = null;
        if (i > 0) {
          //Check previous pair output token
          tokenIn = findTokenByAddress(bestRoutePairs[i - 1], pair.token0.id);
          tokenOut = findTokenByAddress(bestRoutePairs[i - 1], pair.token1.id);

          //Calculate trade in case we didn't have StableSwap pair before, or when index between StableSwap pairs > 1
          if (
            lastStableSwapIndex === -1 ||
            (lastStableSwapIndex !== -1 && i - lastStableSwapIndex > 1)
          ) {
            //Calculate route before we found StableSwap pair
            outputAmountWei = await getTradeOutputAmountWei(
              bestRoutePairs,
              lastStableSwapIndex,
              outputAmountWei,
              network,
              tokenIn || tokenOut
            );
            console.log(outputAmountWei);
          }
        }

        //When StableSwap is first pair
        if (tokenIn === null && tokenOut === null) {
          console.log(
            `bestRoutePairs[i] ${bestRoutePairs[i].token0.symbol}-${bestRoutePairs[i].token1.symbol}`
          );
          console.log(`pair ${pair.token0.symbol}-${pair.token1.symbol}`);
          outputAmountWei = await getPairPriceStableSwap(
            pair.id,
            equalsIgnoreCase(bestRoutePairs[i].token0.address, pair.token0.id)
              ? outputAmountWei
              : null,
            equalsIgnoreCase(bestRoutePairs[i].token0.address, pair.token1.id)
              ? outputAmountWei
              : null
          );
          //All others cases
        } else {
          outputAmountWei = await getPairPriceStableSwap(
            pair.id,
            tokenOut ? outputAmountWei : null,
            tokenIn ? outputAmountWei : null
          );
        }

        lastStableSwapIndex = i;
      }
    }
    if (lastStableSwapIndex !== i) {
      combinePairs.push(fromSdkPair(bestRoutePairs[i]));
    }
  }

  if (lastStableSwapIndex === -1) {
    outputAmountWei = "0";
  } else if (lastStableSwapIndex < bestRoutePairs.length) {
  }

  return { outputAmountWei, pairs: combinePairs };
};

const getTradeOutputAmountWei = async (
  bestRoutePairs: SdkPair[],
  lastStableSwapIndex: number,
  outputAmountWei: string,
  network: number,
  tokenTo: SdkToken
) => {
  const fromIndex = lastStableSwapIndex === -1 ? 0 : lastStableSwapIndex + 1;

  const nextPairSameToken0 = findTokenByAddress(
    bestRoutePairs[fromIndex + 1],
    bestRoutePairs[fromIndex].token0.address
  );
  console.log(
    `from index: ${fromIndex},  bestRoutePairs[fromIndex] ${bestRoutePairs[fromIndex].token0.symbol}-${bestRoutePairs[fromIndex].token1.symbol}}`
  );
  console.log(
    `bestRoutePairs[fromIndex + 1] ${
      bestRoutePairs[fromIndex + 1].token0.symbol
    }-${bestRoutePairs[fromIndex + 1].token1.symbol}}`
  );

  const tokenFrom = nextPairSameToken0
    ? bestRoutePairs[fromIndex].token1
    : bestRoutePairs[fromIndex].token0;

  console.log(`tokenFrom ${tokenFrom.symbol}`);
  console.log(`tokenTo ${tokenTo.symbol}`);

  const request = getQuoteRequest(network, outputAmountWei, tokenFrom, tokenTo);
  const trade = await getBestRouteFromV2(request);
  return trade.outputAmount.numerator.toString();
};

const getQuoteRequest = (
  networkId: number,
  inputAmount: string,
  pairTokenA: SdkToken,
  pairTokenB: SdkToken
): QuoteRequest => {
  return {
    networkId,
    baseToken: pairTokenA.address,
    baseTokenName: pairTokenA.name,
    baseTokenNumDecimals: pairTokenA.decimals,
    baseTokenAmount: inputAmount,

    quoteToken: pairTokenB.address,
    quoteTokenName: pairTokenB.name,
    quoteTokenNumDecimals: pairTokenB.decimals,
    trader: "",
  };
};

const findTokenByAddress = (pair: SdkPair, tokenAddress: string): SdkToken => {
  if (equalsIgnoreCase(pair.token0.address, tokenAddress)) {
    return pair.token0;
  }
  if (equalsIgnoreCase(pair.token1.address, tokenAddress)) {
    return pair.token1;
  }
};

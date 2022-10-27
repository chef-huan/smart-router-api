import { QuoteRequest, Pair } from "../common/model";
import { getTradeExactIn } from "./service/getAmmPrice";
import {
  Currency,
  CurrencyAmount,
  Pair as SdkPair,
  Token,
  Trade,
  TradeType,
} from "@pancakeswap/sdk";
import { bscTokens } from "./config";
import { equalsIgnoreCase } from "../common/utils/helpers";

export const isPairsEquals = (pairA: SdkPair, pairB: Pair) => {
  if (
    equalsIgnoreCase(pairA.token1.address, pairB.token1.id) &&
    equalsIgnoreCase(pairA.token0.address, pairB.token0.id)
  ) {
    return true;
  }
  if (
    equalsIgnoreCase(pairA.token1.address, pairB.token0.id) &&
    equalsIgnoreCase(pairA.token0.address, pairB.token1.id)
  ) {
    return true;
  }
  return false;
};

export const getBestRouteFromV2 = async (
  request: QuoteRequest
): Promise<Trade<Currency, Currency, TradeType> | null> => {
  const isTradeIn = request.baseTokenAmount !== undefined;
  const tokenIn = findTokenInConfig(request.baseToken);
  const tokenOut = findTokenInConfig(request.quoteToken);
  console.log(tokenIn.name, tokenOut.name, isTradeIn);

  if (isTradeIn) {
    if (tokenIn) {
      const input = CurrencyAmount.fromRawAmount(
        tokenIn,
        request.baseTokenAmount
      ); //Amount should be in decimal
      return await getTradeExactIn(input, tokenOut);
    }
  } else {
    const input = CurrencyAmount.fromRawAmount(
      tokenOut,
      request.quoteTokenAmount
    ); //Amount should be in decimal
    return await getTradeExactIn(input, tokenIn);
  }
};

const findTokenInConfig = (address: string): Token => {
  let found;
  for (const key of Object.keys(bscTokens)) {
    const token: Token = bscTokens[key];
    if (token && token.address.toLowerCase() === address.toLowerCase()) {
      found = token;
      break;
    }
  }
  return found;
};

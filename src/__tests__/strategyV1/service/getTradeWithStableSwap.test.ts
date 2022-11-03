import { ChainId, CurrencyAmount, Pair, Route, Token, Trade, TradeType } from '@pancakeswap/sdk';
import * as dotenv from 'dotenv';
import { AddressZero } from '@ethersproject/constants';
import { parseUnits } from '@ethersproject/units';

import { bscTokens } from '../../../strategyV1/config';
import * as getAmmPrice from '../../../strategyV1/service/getAmmPrice';
import * as priceStableSwap from '../../../strategyV2/service/onchain/priceStableSwap';
import { getTradeWithStableSwap } from '../../../strategyV1/service/getTradeWithStableSwap';
import { StableSwapPair } from '../../../common/service/stableSwapPairs';

dotenv.config();

type TokenWithAmount = [Token, number];

function getAmount([token, amount]: TokenWithAmount) {
  return CurrencyAmount.fromRawAmount(token, parseUnits(String(amount), token.decimals).toString());
}

function createMockPair(one: TokenWithAmount, another: TokenWithAmount) {
  return new Pair(getAmount(one), getAmount(another));
}

function createMockStableSwapPair(one: TokenWithAmount, another: TokenWithAmount): StableSwapPair {
  const pair = createMockPair(one, another);
  (pair as StableSwapPair).stableSwapAddress = AddressZero;
  return pair as StableSwapPair;
}

function createMockTrade(tokens: TokenWithAmount[]) {
  const getPairs = () => {
    const pairs: Pair[] = [];
    for (const [index, token] of tokens.entries()) {
      if (index === tokens.length - 1) {
        break;
      }
      pairs.push(createMockPair(token, tokens[index + 1]));
    }

    return pairs;
  };
  const firstToken = tokens[0];
  const lastToken = tokens[tokens.length - 1];
  const [tokenIn] = firstToken;
  const [tokenOut] = tokens[tokens.length - 1];
  const trade = new Trade(
    new Route(getPairs(), tokenIn, tokenOut),
    getAmount(firstToken),
    TradeType.EXACT_INPUT,
  );
  // Override the output amount since trade would calculate the output based on the input
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  (trade as any).outputAmount = getAmount(lastToken);
  return trade;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getTradeWithStableSwap', () => {
  const chainId = ChainId.BSC;

  it('No available stable swap pairs', async () => {
    const stableSwapPairs: StableSwapPair[] = [];
    // Assume the base route is APLA -> HAY -> BUSD -> BNB
    // Amount flow is 100 APLA -> 500 HAY -> 499 BUSD -> 20 BNB
    const baseTrade = createMockTrade([
      [bscTokens.alpa, 100],
      [bscTokens.hay, 500],
      [bscTokens.busd, 499],
      [bscTokens.bnb, 20],
    ]);
    const getBestRouteFromV2 = jest.spyOn(getAmmPrice, 'getBestRouteFromV2');
    const getPairPriceStableSwap = jest.spyOn(priceStableSwap, 'getPairPriceStableSwap');

    await expect(getTradeWithStableSwap(chainId, baseTrade, stableSwapPairs)).resolves.toEqual({
      outputAmount: baseTrade.outputAmount,
      pairs: baseTrade.route.pairs,
    });
    expect(getBestRouteFromV2).not.toHaveBeenCalled();
    expect(getPairPriceStableSwap).not.toHaveBeenCalled();
  });

  it('Stable swap pairs available but not matched', async () => {
    const stableSwapPairs: StableSwapPair[] = [
      createMockStableSwapPair([bscTokens.busd, 1], [bscTokens.usdc, 1]),
    ];
    // Assume the base route is APLA -> HAY -> BUSD -> BNB
    // Amount flow is 100 APLA -> 500 HAY -> 499 BUSD -> 20 BNB
    const baseTrade = createMockTrade([
      [bscTokens.alpa, 100],
      [bscTokens.hay, 500],
      [bscTokens.busd, 499],
      [bscTokens.bnb, 20],
    ]);
    const getBestRouteFromV2 = jest.spyOn(getAmmPrice, 'getBestRouteFromV2');
    const getPairPriceStableSwap = jest.spyOn(priceStableSwap, 'getPairPriceStableSwap');

    await expect(getTradeWithStableSwap(chainId, baseTrade, stableSwapPairs)).resolves.toEqual({
      outputAmount: baseTrade.outputAmount,
      pairs: baseTrade.route.pairs,
    });
    expect(getBestRouteFromV2).not.toHaveBeenCalled();
    expect(getPairPriceStableSwap).not.toHaveBeenCalled();
  });

  it('Stable swap pairs matched and applied', async () => {
    const stableSwapPairs: StableSwapPair[] = [
      createMockStableSwapPair([bscTokens.hay, 1], [bscTokens.busd, 1]),
    ];
    // Assume the base route is APLA -> HAY -> BUSD -> BNB
    // Amount flow is 100 APLA -> 500 HAY -> 499 BUSD -> 20 BNB
    const baseTrade = createMockTrade([
      [bscTokens.alpa, 100],
      [bscTokens.hay, 500],
      [bscTokens.busd, 499],
      [bscTokens.bnb, 20],
    ]);
    // Assue stable swap would provide a better output on busd
    const getPairPriceStableSwap = jest
      .spyOn(priceStableSwap, 'getPairPriceStableSwap')
      .mockImplementationOnce(async () => parseUnits('499.1', bscTokens.busd.decimals).toString());
    const getBestRouteFromV2 = jest
      .spyOn(getAmmPrice, 'getBestRouteFromV2')
      .mockImplementationOnce(async () =>
        createMockTrade([
          [bscTokens.alpa, 100],
          [bscTokens.hay, 500],
        ]),
      )
      .mockImplementationOnce(async () =>
        createMockTrade([
          [bscTokens.busd, 499.1],
          [bscTokens.bnb, 20.1],
        ]),
      );

    await expect(getTradeWithStableSwap(chainId, baseTrade, stableSwapPairs)).resolves.toEqual({
      outputAmount: getAmount([bscTokens.bnb, 20.1]),
      pairs: [
        ...baseTrade.route.pairs.slice(0, 1),
        stableSwapPairs[0],
        ...baseTrade.route.pairs.slice(2, 3),
      ],
    });
    expect(getBestRouteFromV2).toHaveBeenCalledTimes(2);
    expect(getPairPriceStableSwap).toHaveBeenCalledTimes(1);
  });

  it('The last pair of base trade route matched one of the stable swap pairs', async () => {
    const stableSwapPairs: StableSwapPair[] = [
      createMockStableSwapPair([bscTokens.hay, 1], [bscTokens.busd, 1]),
    ];
    // Assume the base route is APLA -> HAY -> BUSD
    // Amount flow is 100 APLA -> 500 HAY -> 499 BUSD
    const baseTrade = createMockTrade([
      [bscTokens.alpa, 100],
      [bscTokens.hay, 500],
      [bscTokens.busd, 499],
    ]);
    // Assue stable swap would provide a better output on busd
    const getPairPriceStableSwap = jest
      .spyOn(priceStableSwap, 'getPairPriceStableSwap')
      .mockImplementationOnce(async () => parseUnits('499.1', bscTokens.busd.decimals).toString());
    const getBestRouteFromV2 = jest
      .spyOn(getAmmPrice, 'getBestRouteFromV2')
      .mockImplementationOnce(async () =>
        createMockTrade([
          [bscTokens.alpa, 100],
          [bscTokens.hay, 500],
        ]),
      );

    await expect(getTradeWithStableSwap(chainId, baseTrade, stableSwapPairs)).resolves.toEqual({
      outputAmount: getAmount([bscTokens.busd, 499.1]),
      pairs: [...baseTrade.route.pairs.slice(0, 1), stableSwapPairs[0]],
    });
    expect(getBestRouteFromV2).toHaveBeenCalledTimes(1);
    expect(getPairPriceStableSwap).toHaveBeenCalledTimes(1);
  });

  it('Multiple stable swap pairs found', async () => {
    const stableSwapPairs: StableSwapPair[] = [
      createMockStableSwapPair([bscTokens.hay, 1], [bscTokens.busd, 1]),
      createMockStableSwapPair([bscTokens.busd, 1], [bscTokens.usdc, 1]),
    ];
    // Assume the base route is HAY -> BUSD -> USDC
    // Amount flow is 100 HAY -> 99 BUSD -> 98 USDC
    const baseTrade = createMockTrade([
      [bscTokens.hay, 100],
      [bscTokens.busd, 99],
      [bscTokens.usdc, 98],
    ]);
    // Assue stable swap would provide a better output on busd
    const getPairPriceStableSwap = jest
      .spyOn(priceStableSwap, 'getPairPriceStableSwap')
      .mockImplementationOnce(async () => parseUnits('99.1', bscTokens.busd.decimals).toString())
      .mockImplementationOnce(async () => parseUnits('98.1', bscTokens.usdc.decimals).toString());
    const getBestRouteFromV2 = jest.spyOn(getAmmPrice, 'getBestRouteFromV2');

    await expect(getTradeWithStableSwap(chainId, baseTrade, stableSwapPairs)).resolves.toEqual({
      outputAmount: getAmount([bscTokens.usdc, 98.1]),
      pairs: stableSwapPairs,
    });
    expect(getBestRouteFromV2).not.toHaveBeenCalled();
    expect(getPairPriceStableSwap).toHaveBeenCalledTimes(2);
  });
});

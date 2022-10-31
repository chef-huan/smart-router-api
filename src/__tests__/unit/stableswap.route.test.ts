import { Pair, PairType, QuoteRequest } from "../../common/model";
import * as getAmmPrice from "../../strategyV1/service/getAmmPrice";
import {
  Currency,
  CurrencyAmount,
  Pair as SdkPair,
  Route,
  Token as SdkToken,
  Trade,
  TradeType,
} from "@pancakeswap/sdk";
import { bscTokens } from "../../strategyV1/config";

import * as dotenv from "dotenv";
import { equalsIgnoreCase } from "../../common/utils/helpers";
import { getRoutWithStableSwap } from "../../strategyV1/service/getRoutWithStableSwap";

dotenv.config();

describe("Empty tests", () => {
  const cake = CurrencyAmount.fromRawAmount(bscTokens.cake, "10");

  const bnb = CurrencyAmount.fromRawAmount(bscTokens.bnb, "10");

  const alpaca = CurrencyAmount.fromRawAmount(bscTokens.alpa, "10");

  const busd = CurrencyAmount.fromRawAmount(bscTokens.busd, "10");

  const hay = CurrencyAmount.fromRawAmount(bscTokens.hay, "10");

  describe("Test", () => {
    const requestIn: QuoteRequest = {
      networkId: 56,
      baseToken: bscTokens.alpa.address,
      baseTokenName: bscTokens.alpa.name,
      baseTokenNumDecimals: bscTokens.alpa.decimals,

      quoteToken: bscTokens.hay.address,
      quoteTokenName: bscTokens.hay.name,
      quoteTokenNumDecimals: bscTokens.hay.decimals,

      baseTokenAmount: "100000000000000000",

      trader: "huan",
    };

    const requestOut: QuoteRequest = {
      networkId: 56,
      baseToken: bscTokens.alpa.address,
      baseTokenName: bscTokens.alpa.name,
      baseTokenNumDecimals: bscTokens.alpa.decimals,

      quoteToken: bscTokens.hay.address,
      quoteTokenName: bscTokens.hay.name,
      quoteTokenNumDecimals: bscTokens.hay.decimals,

      quoteTokenAmount: "100000000000000000",

      trader: "huan",
    };

    const stableSwapPairs: Pair[] = [
      {
        id: "0x49079d07ef47449af808a4f36c2a8dec975594ec",
        volumeUSD: "3606401.348366277736185337043746541",
        trackedReserveBNB: "53252.00679014556183901217654625879",
        token0: {
          id: "0x0782b6d8c4551b9760e74c0545a9bcd90bdc41e5",
          symbol: "HAY",
          name: "Hay Stablecoin",
        },
        token1: {
          id: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
          symbol: "BUSD",
          name: "BUSD Token",
        },
        type: 1,
      },
    ];

    it("First pair in route should be updated by stableswap pair", async () => {
      const sdkPairs: SdkPair[] = [
        new SdkPair(busd, hay),
        new SdkPair(cake, busd),
      ];

      const getBestRouteFromV2MOCK = jest.spyOn(
        getAmmPrice,
        "getBestRouteFromV2"
      );
      getBestRouteFromV2MOCK.mockImplementation(async (request) => {
        if (
          equalsIgnoreCase(request.baseToken, bscTokens.busd.address) &&
          equalsIgnoreCase(request.quoteToken, bscTokens.cake.address)
        ) {
          return new Trade<Currency, Currency, TradeType>(
            new Route<SdkToken, SdkToken>(
              [new SdkPair(cake, busd)],
              bscTokens.busd,
              bscTokens.cake
            ),
            busd,
            TradeType.EXACT_INPUT
          );
        }
        return null;
      });

      const { pairs, outputAmountWei } = await getRoutWithStableSwap(
        sdkPairs,
        stableSwapPairs,
        18,
        "50000000000000000000"
      );

      expect(pairs[0].type).toEqual(PairType.STABLE_SWAP);
      expect(pairs[1].type).toEqual(PairType.V2);
      expect(pairs[0].token0.symbol).toEqual("HAY");
      expect(pairs[0].token1.symbol).toEqual("BUSD");
      expect(pairs[1].token0.symbol).toEqual("CAKE");
      expect(pairs[1].token1.symbol).toEqual("BUSD");
    });

    it("Second pair in route should be updated by stableswap pair", async () => {
      const sdkPairs: SdkPair[] = [
        new SdkPair(cake, busd),
        new SdkPair(busd, hay),
      ];

      const getBestRouteFromV2MOCK = jest.spyOn(
        getAmmPrice,
        "getBestRouteFromV2"
      );
      getBestRouteFromV2MOCK.mockImplementation(async (request) => {
        if (
          equalsIgnoreCase(request.baseToken, bscTokens.cake.address) &&
          equalsIgnoreCase(request.quoteToken, bscTokens.busd.address)
        ) {
          return new Trade<Currency, Currency, TradeType>(
            new Route<SdkToken, SdkToken>(
              [new SdkPair(cake, busd)],
              bscTokens.cake,
              bscTokens.busd
            ),
            cake,
            TradeType.EXACT_INPUT
          );
        }
        return null;
      });

      const { pairs, outputAmountWei } = await getRoutWithStableSwap(
        sdkPairs,
        stableSwapPairs,
        18,
        "50000000000000000000"
      );

      expect(pairs[0].type).toEqual(PairType.V2);
      expect(pairs[1].type).toEqual(PairType.STABLE_SWAP);
      expect(pairs[0].token0.symbol).toEqual("CAKE");
      expect(pairs[0].token1.symbol).toEqual("BUSD");
      expect(pairs[1].token0.symbol).toEqual("HAY");
      expect(pairs[1].token1.symbol).toEqual("BUSD");
    });

    it("Middle pair in route should be updated by stableswap pair", async () => {
      const sdkPairs: SdkPair[] = [
        new SdkPair(bnb, busd),
        new SdkPair(hay, busd),
        new SdkPair(cake, hay),
      ];

      const getBestRouteFromV2MOCK = jest.spyOn(
        getAmmPrice,
        "getBestRouteFromV2"
      );
      getBestRouteFromV2MOCK.mockImplementation(async (request) => {
        if (
          equalsIgnoreCase(request.baseToken, bscTokens.bnb.address) &&
          equalsIgnoreCase(request.quoteToken, bscTokens.busd.address)
        ) {
          return new Trade<Currency, Currency, TradeType>(
            new Route<SdkToken, SdkToken>(
              [new SdkPair(bnb, busd)],
              bscTokens.bnb,
              bscTokens.busd
            ),
            bnb,
            TradeType.EXACT_INPUT
          );
        }
        if (
          equalsIgnoreCase(request.baseToken, bscTokens.hay.address) &&
          equalsIgnoreCase(request.quoteToken, bscTokens.cake.address)
        ) {
          return new Trade<Currency, Currency, TradeType>(
            new Route<SdkToken, SdkToken>(
              [new SdkPair(hay, cake)],
              bscTokens.hay,
              bscTokens.cake
            ),
            hay,
            TradeType.EXACT_INPUT
          );
        }
        return null;
      });

      const { pairs, outputAmountWei } = await getRoutWithStableSwap(
        sdkPairs,
        stableSwapPairs,
        18,
        "50000000000000000000"
      );

      expect(pairs[0].type).toEqual(PairType.V2);
      expect(pairs[1].type).toEqual(PairType.STABLE_SWAP);
      expect(pairs[2].type).toEqual(PairType.V2);

      expect(pairs[0].token0.symbol).toEqual("BNB");
      expect(pairs[0].token1.symbol).toEqual("BUSD");
      expect(pairs[1].token0.symbol).toEqual("HAY");
      expect(pairs[1].token1.symbol).toEqual("BUSD");
      expect(pairs[2].token0.symbol).toEqual("HAY");
      expect(pairs[2].token1.symbol).toEqual("CAKE");
    });

    it("Multi pairs in route should be updated by stableswap pair", async () => {
      const sdkPairs: SdkPair[] = [
        new SdkPair(bnb, busd),
        new SdkPair(busd, hay),
        new SdkPair(hay, alpaca),
        new SdkPair(alpaca, bnb),
        new SdkPair(bnb, busd),
        new SdkPair(busd, hay),
      ];

      const getBestRouteFromV2MOCK = jest.spyOn(
        getAmmPrice,
        "getBestRouteFromV2"
      );
      getBestRouteFromV2MOCK.mockImplementation(async (request) => {
        console.log(request);
        if (
          equalsIgnoreCase(request.baseToken, bscTokens.bnb.address) &&
          equalsIgnoreCase(request.quoteToken, bscTokens.busd.address)
        ) {
          return new Trade<Currency, Currency, TradeType>(
            new Route<SdkToken, SdkToken>(
              [new SdkPair(bnb, busd)],
              bscTokens.bnb,
              bscTokens.busd
            ),
            bnb,
            TradeType.EXACT_INPUT
          );
        }
        if (
          equalsIgnoreCase(request.baseToken, bscTokens.hay.address) &&
          equalsIgnoreCase(request.quoteToken, bscTokens.busd.address)
        ) {
          return new Trade<Currency, Currency, TradeType>(
            new Route<SdkToken, SdkToken>(
              [new SdkPair(hay, busd)],
              bscTokens.hay,
              bscTokens.busd
            ),
            hay,
            TradeType.EXACT_INPUT
          );
        }
        return null;
      });

      const { pairs, outputAmountWei } = await getRoutWithStableSwap(
        sdkPairs,
        stableSwapPairs,
        18,
        "50000000000000000000"
      );

      expect(pairs[0].type).toEqual(PairType.V2);
      expect(pairs[1].type).toEqual(PairType.STABLE_SWAP);
      expect(pairs[2].type).toEqual(PairType.V2);
      expect(pairs[3].type).toEqual(PairType.V2);
      expect(pairs[4].type).toEqual(PairType.V2);
      expect(pairs[5].type).toEqual(PairType.STABLE_SWAP);

      expect(pairs[0].token0.symbol).toEqual("BNB");
      expect(pairs[0].token1.symbol).toEqual("BUSD");
      expect(pairs[1].token0.symbol).toEqual("HAY");
      expect(pairs[1].token1.symbol).toEqual("BUSD");
      expect(pairs[2].token0.symbol).toEqual("HAY");
      expect(pairs[2].token1.symbol).toEqual("ALPA");
      expect(pairs[3].token0.symbol).toEqual("BNB");
      expect(pairs[3].token1.symbol).toEqual("ALPA");
      expect(pairs[4].token0.symbol).toEqual("BNB");
      expect(pairs[4].token1.symbol).toEqual("BUSD");
      expect(pairs[5].token0.symbol).toEqual("HAY");
      expect(pairs[5].token1.symbol).toEqual("BUSD");
    });
  });
});

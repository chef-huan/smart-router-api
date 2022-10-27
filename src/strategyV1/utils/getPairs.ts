import { ChainId, Currency, CurrencyAmount, Pair } from "@pancakeswap/sdk";
import IPancakePairABI from "../../abi/IPancakePair.json";
import { wrappedCurrency } from "./wrappedCurrency";
import { multicallv2 } from "../../common/utils/onchain/multicall";
import { MultiCall, PairReserve } from "../../common/model";

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export async function getPairs(
  currencies: [Currency | undefined, Currency | undefined][],
  chainId: ChainId
): Promise<[PairState, Pair | null][]> {
  const tokens = currencies.map(([currencyA, currencyB]) => [
    wrappedCurrency(currencyA, chainId),
    wrappedCurrency(currencyB, chainId),
  ]);

  const pairAddresses = tokens.map(([tokenA, tokenB]) => {
    try {
      return tokenA && tokenB && !tokenA.equals(tokenB)
        ? Pair.getAddress(tokenA, tokenB)
        : undefined;
    } catch (error: any) {
      // Debug Invariant failed related to this line
      console.error(
        error.msg,
        `- pairAddresses: ${tokenA?.address}-${tokenB?.address}`,
        `chainId: ${tokenA?.chainId}`
      );

      return undefined;
    }
  });

  const reserveCalls: MultiCall[] = pairAddresses.map((address) => ({
    address: address as string,
    name: "getReserves",
    params: [],
  }));

  const results = await multicallv2<PairReserve[]>(
    IPancakePairABI,
    reserveCalls,
    {
      requireSuccess: false,
    }
  );

  return results.map((result, i) => {
    if (!result) return [PairState.NOT_EXISTS, null];

    const tokenA = tokens[i][0];
    const tokenB = tokens[i][1];

    if (!tokenA || !tokenB || tokenA.equals(tokenB))
      return [PairState.INVALID, null];

    const [token0, token1] = tokenA.sortsBefore(tokenB)
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

    const { reserve0, reserve1 } = result;
    return [
      PairState.EXISTS,
      new Pair(
        CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
        CurrencyAmount.fromRawAmount(token1, reserve1.toString())
      ),
    ];
  });
}

export async function getPair(
  chainId: ChainId,
  tokenA?: Currency,
  tokenB?: Currency
): Promise<[PairState, Pair | null]> {
  const pairCurrencies: [Currency | undefined, Currency | undefined][] = [
    [tokenA, tokenB],
  ];
  return (await getPairs(pairCurrencies, chainId))[0];
}

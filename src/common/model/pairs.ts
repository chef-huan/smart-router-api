import { PairType } from "./pairType";
import { Pair as SdkPair } from "@pancakeswap/sdk";

export interface Pair {
  id: string;
  volumeUSD?: string;
  trackedReserveBNB?: string;
  block?: string;
  type: PairType;
  token0: {
    id: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  token1: {
    id: string;
    symbol: string;
    name: string;
    decimals: number;
  };
}

export const fromSdkPair = (pair: SdkPair): Pair => {
  return {
    id: pair.liquidityToken.address,
    token0: {
      id: pair.token0.address,
      symbol: pair.token0.symbol,
      name: pair.token0.name,
      decimals: pair.token0.decimals,
    },
    token1: {
      id: pair.token1.address,
      symbol: pair.token1.symbol,
      name: pair.token1.name,
      decimals: pair.token1.decimals,
    },
    type: PairType.V2,
  };
};

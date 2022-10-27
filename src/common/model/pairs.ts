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
  };
  token1: {
    id: string;
    symbol: string;
    name: string;
  };
}

export const fromSdkPair = (pair: SdkPair): Pair => {
  return {
    id: pair.liquidityToken.address,
    token0: {
      id: pair.token0.address,
      symbol: pair.token0.symbol,
      name: pair.token0.name,
    },
    token1: {
      id: pair.token1.address,
      symbol: pair.token1.symbol,
      name: pair.token1.name,
    },
    type: PairType.V2,
  };
};

import { PairType } from './pairType';
import { Pair as SdkPair, Token as SdkToken } from '@pancakeswap/sdk';

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

export const fromSdkTokens = (token0: SdkToken, token1: SdkToken): Pair => {
  return {
    id: `${SdkPair.getAddress(token0, token1)}`,
    token0: {
      id: token0.address,
      symbol: token0.symbol,
      name: token0.name,
      decimals: token0.decimals,
    },
    token1: {
      id: token1.address,
      symbol: token1.symbol,
      name: token1.name,
      decimals: token1.decimals,
    },
    type: PairType.V2,
  };
};

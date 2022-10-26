import { BigNumber, FixedNumber } from "ethers";

export interface Pair {
  id: string;
  volumeUSD: string;
  trackedReserveBNB: string;
  block: string;
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

export interface PairWithPrice extends Pair {
  token0price: FixedNumber;
  token1price: FixedNumber;

  reserve0: FixedNumber;
  reserve1: FixedNumber;
}

export interface PairQueryResponse {
  data: Pair[];
}

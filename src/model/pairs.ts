export interface Pair {
  id: string;
  reserve0: string;
  reserve1: string;
  reserveUSD: string;
  volumeUSD: string;
  token0Price: string;
  token1Price: string;
  trackedReserveBNB: string;
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

export interface PairQueryResponse {
  data: Pair[];
}

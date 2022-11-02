import { gql } from "graphql-request";
import { Pair as SdkPair, ChainId, Token } from "@pancakeswap/sdk";

import { infoClient } from "../utils/subgraph/subgraphClient";
import { SUBGRAPH_URL } from "../utils/constants";
import { PairQueryResponse } from "../../strategyV2/model/pairs";
import { Pair, PairType } from "../model";
import { getPairs, PairState } from "../../strategyV1/utils/getPairs";

const getPairsFirstPage = async (): Promise<Pair[]> => {
  const { data } = await infoClient(SUBGRAPH_URL.STABLE_SWAP)
    .request<PairQueryResponse>(gql`
    query pair {
      data: pairs(
        first: 1000
        orderBy: trackedReserveBNB
        orderDirection: desc
        where: { trackedReserveBNB_gt: 100 }
      ) {
        id
        volumeUSD
        trackedReserveBNB
        token0 {
          id
          symbol
          name
        }
        token1 {
          id
          symbol
          name
        }
      }
    }
  `);

  return data;
};

const getPairsNextPages = async (maxTrackedReserveBNB: string) => {
  const { data } = await infoClient(
    SUBGRAPH_URL.STABLE_SWAP
  ).request<PairQueryResponse>(
    gql`
      query pair($maxTrackedReserveBNB: String) {
        data: pairs(
          orderBy: trackedReserveBNB
          orderDirection: desc
          first: 1000
          where: {
            trackedReserveBNB_gt: 100
            trackedReserveBNB_lt: $maxTrackedReserveBNB
          }
        ) {
          id
          volumeUSD
          trackedReserveBNB
          token0 {
            id
            symbol
            name
          }
          token1 {
            id
            symbol
            name
          }
        }
      }
    `,
    { maxTrackedReserveBNB }
  );

  return data;
};

export const getAllPairsStableSwap = async (): Promise<Pair[]> => {
  let pairs: Pair[] = [];
  let pairsPage = await getPairsFirstPage();
  pairs = pairs.concat(pairsPage);

  while (pairsPage.length === 1000) {
    pairsPage = await getPairsNextPages(
      pairs[pairs.length - 1].trackedReserveBNB
    );
    pairs = pairs.concat(pairsPage);
  }

  return pairs.map((pair) => {
    pair.type = PairType.STABLE_SWAP;
    return pair;
  });
};

export interface StableSwapPair extends SdkPair {
  stableSwapAddress: string;
}

export function isStableSwapPair(pair: SdkPair): pair is StableSwapPair {
  return !!(pair as StableSwapPair).stableSwapAddress;
}

export const getAllPairsStableSwapRefactor = async (chainId: ChainId): Promise<StableSwapPair[]> => {
  // FIXME should use chain id to get all pairs reside on the specified network
  let pairs: Pair[] = [];
  let pairsPage = await getPairsFirstPage();
  pairs = pairs.concat(pairsPage);

  while (pairsPage.length === 1000) {
    pairsPage = await getPairsNextPages(
      pairs[pairs.length - 1].trackedReserveBNB
    );
    pairs = pairs.concat(pairsPage);
  }

  const currencies: [Token, Token][] = pairs.map(pair => ([
    new Token(
      chainId,
      pair.token0.id,
      // FIXME should get the decimal from subgraph
      18,
      pair.token0.symbol,
      pair.token0.name,
    ),
    new Token(
      chainId,
      pair.token1.id,
      // FIXME should get the decimal from subgraph
      18,
      pair.token1.symbol,
      pair.token1.name,
    ),
  ]));

  const pairStates = await getPairs(currencies, chainId);
  return pairStates
    .map(([state, pair], index) => {
      const stablePair: StableSwapPair = pair as StableSwapPair;
      stablePair.stableSwapAddress = pairs[index].id;
      return [state, stablePair];
    })
    .filter(([state]) => (state === PairState.EXISTS))
    .map(([, pair]) => pair) as StableSwapPair[];
};

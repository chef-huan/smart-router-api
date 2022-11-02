import { gql } from "graphql-request";
import { Pair as SdkPair, ChainId, Token, CurrencyAmount } from "@pancakeswap/sdk";
import { getAddress } from '@ethersproject/address';

import { infoClient } from "../utils/subgraph/subgraphClient";
import { SUBGRAPH_URL } from "../utils/constants";
import { PairQueryResponse } from "../../strategyV2/model/pairs";
import { Pair, PairType } from "../model";

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
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
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
  // Stable swap is only supported on BSC chain
  if (chainId !== ChainId.BSC) {
    return [];
  }

  let pairs: Pair[] = [];
  let pairsPage = await getPairsFirstPage();
  pairs = pairs.concat(pairsPage);

  while (pairsPage.length === 1000) {
    pairsPage = await getPairsNextPages(
      pairs[pairs.length - 1].trackedReserveBNB
    );
    pairs = pairs.concat(pairsPage);
  }

  return pairs.map(p => {
    const pair = new SdkPair(
      CurrencyAmount.fromRawAmount(
        new Token(
          chainId,
          getAddress(p.token0.id),
          Number(p.token0.decimals),
          p.token0.symbol,
          p.token0.name,
        ),
        '0',
      ),
      CurrencyAmount.fromRawAmount(
        new Token(
          chainId,
          getAddress(p.token1.id),
          Number(p.token1.decimals),
          p.token1.symbol,
          p.token1.name,
        ),
        '0',
      ),
    );
    (pair as StableSwapPair).stableSwapAddress = p.id;
    return pair as StableSwapPair;
  });
};

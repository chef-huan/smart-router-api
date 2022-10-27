import { gql } from "graphql-request";
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
  console.log(
    `All Fetch ${pairs.length}, Last: ${pairs[pairs.length - 1].id}, Url:${
      SUBGRAPH_URL.STABLE_SWAP
    }`
  );

  while (pairsPage.length === 1000) {
    pairsPage = await getPairsNextPages(
      pairs[pairs.length - 1].trackedReserveBNB
    );
    pairs = pairs.concat(pairsPage);
    console.log(
      `All Fetch ${pairs.length}, Last: ${pairs[pairs.length - 1].id}, Url:${
        SUBGRAPH_URL.STABLE_SWAP
      }`
    );
  }

  return pairs.map((pair) => {
    pair.type = PairType.STABLE_SWAP;
    return pair;
  });
};

import { gql } from "graphql-request";
import { infoClient } from "../../../common/utils/subgraph/subgraphClient";
import { SUBGRAPH_URL } from "../../../common/utils/constants";
import { Pair, PairQueryResponse } from "../../model/pairs";
import { PairType } from "../../../common/model";

const getPairsFirstPage = async (): Promise<Pair[]> => {
  const { data } = await infoClient(SUBGRAPH_URL.STREAMING_FAST_V2)
    .request<PairQueryResponse>(gql`
    query pair {
      data: pairs(
        first: 1000
        orderBy: trackedReserveBNB
        orderDirection: desc
        where: { trackedReserveBNB_gt: 1000 }
      ) {
        id
        volumeUSD
        trackedReserveBNB
      }
    }
  `);

  return data;
};

const getPairsNextPages = async (maxTrackedReserveBNB: string) => {
  const { data } = await infoClient(
    SUBGRAPH_URL.STREAMING_FAST_V2
  ).request<PairQueryResponse>(
    gql`
      query pair($maxTrackedReserveBNB: String) {
        data: pairs(
          orderBy: trackedReserveBNB
          orderDirection: desc
          first: 1000
          where: {
            trackedReserveBNB_gt: 1000
            trackedReserveBNB_lt: $maxTrackedReserveBNB
          }
        ) {
          id
          volumeUSD
          trackedReserveBNB
        }
      }
    `,
    { maxTrackedReserveBNB }
  );

  return data;
};

export const getAllPairsV2SF = async (): Promise<Pair[]> => {
  let pairs: Pair[] = [];
  let pairsPage = await getPairsFirstPage();
  pairs = pairs.concat(pairsPage);
  console.log(
    `All Fetch ${pairs.length}, Last: ${pairs[pairs.length - 1].id}, Url:${
      SUBGRAPH_URL.STABLE_SWAP
    }`
  );

  while (pairsPage.length === 1000) {
    console.log(pairs[pairs.length - 1]);
    console.log(
      `last trackedReserveBNB ${pairs[pairs.length - 1].trackedReserveBNB}`
    );
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
    pair.type = PairType.V2;
    return pair;
  });
};

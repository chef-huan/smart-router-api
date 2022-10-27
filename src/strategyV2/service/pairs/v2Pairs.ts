import { gql } from "graphql-request";
import { infoClient } from "../../../common/utils/subgraph/subgraphClient";
import { SUBGRAPH_URL } from "../../../common/utils/constants";
import { Pair, PairQueryResponse } from "../../model/pairs";
import { PairType } from "../../../common/model";

export const getPairsPagesById = async (ids: string[]) => {
  const { data } = await infoClient(
    SUBGRAPH_URL.PAIRS
  ).request<PairQueryResponse>(
    gql`
      query pair($ids: [String]) {
        data: pairs(first: 1000, where: { id_in: $ids }) {
          id
          name
          block
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
    { ids }
  );

  return data;
};

const getPairsFirstPage = async (): Promise<Pair[]> => {
  const { data } = await infoClient(SUBGRAPH_URL.PAIRS)
    .request<PairQueryResponse>(gql`
    query pair {
      data: pairs(first: 1000, orderBy: block, orderDirection: desc) {
        id
        block
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

const getPairsNextPages = async (maxBlock: string) => {
  const { data } = await infoClient(
    SUBGRAPH_URL.PAIRS
  ).request<PairQueryResponse>(
    gql`
      query pair($maxBlock: String) {
        data: pairs(
          orderBy: block
          orderDirection: desc
          first: 1000
          where: { block_lt: $maxBlock }
        ) {
          id
          name
          block
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
    { maxBlock }
  );

  return data;
};

export const getAllPairsV2 = async (): Promise<Pair[]> => {
  let pairs: Pair[] = [];
  let pairsPage = await getPairsFirstPage();
  pairs = pairs.concat(pairsPage);
  console.log(
    `All Fetch ${pairs.length}, Last: ${pairs[pairs.length - 1].id}, Url:${
      SUBGRAPH_URL.PAIRS
    }`
  );

  while (pairsPage.length === 1000) {
    console.log(pairs[pairs.length - 1]);
    console.log(`last block ${pairs[pairs.length - 1].block}`);
    pairsPage = await getPairsNextPages(pairs[pairs.length - 1].block);
    pairs = pairs.concat(pairsPage);
    console.log(
      `All Fetch ${pairs.length}, Last: ${pairs[pairs.length - 1].id}, Url:${
        SUBGRAPH_URL.PAIRS
      }`
    );
  }

  return pairs.map((pair) => {
    pair.type = PairType.V2;
    return pair;
  });
};

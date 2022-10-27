import { GraphQLClient } from "graphql-request";
import { SUBGRAPH_URL } from "../constants";

export const getGQLHeaders = (subgraphUrl: SUBGRAPH_URL) => {
  if (subgraphUrl === SUBGRAPH_URL.STREAMING_FAST_V2) {
    if (!process.env.SF_HEADER) {
      throw new Error("SF_HEADER not set");
    }
    return { "X-Sf": process.env.SF_HEADER };
  }
  return undefined;
};

export const infoClient = (subgraphUrl: SUBGRAPH_URL) =>
  new GraphQLClient(subgraphUrl, { headers: getGQLHeaders(subgraphUrl) });

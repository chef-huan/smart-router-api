import { Pair } from "../../../common/model/pairs";
import { getAllPairsV2SF } from "./v2PairsSteamingFast";
import { getPairsPagesById } from "./v2Pairs";
import { chunk } from "lodash";
export * from "../../../common/service/stableSwapPairs";

export const getPairsV2Combined = async (): Promise<Pair[]> => {
  const poorPairs = await getAllPairsV2SF();
  let pairs: Pair[] = [];
  for (const pairChunk of chunk<Pair>(poorPairs, 1000)) {
    const pairsWithToken = await getPairsPagesById(
      pairChunk.map((el) => el.id)
    );
    const t = pairChunk.map((el) => {
      const pair = pairsWithToken.find((pt) => pt.id === el.id);
      if (pair) {
        el.token0 = pair.token0;
        el.token1 = pair.token1;
      }
      return el;
    });
    pairs = pairs.concat(t);
  }

  return pairs;
};

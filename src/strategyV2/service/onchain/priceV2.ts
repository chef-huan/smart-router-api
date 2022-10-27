import { PairWithPrice } from "../../model/pairs";
import { multicallv2 } from "../../../common/utils/onchain/multicall";
import { MultiCall, Pair, PairReserve } from "../../../common/model";
import IPancakePair from "../../../abi/IPancakePair.json";
import { FixedNumber } from "ethers";

export const getPairPriceV2 = async (
  pairs: Pair[]
): Promise<PairWithPrice[]> => {
  const poolInfoCalls: MultiCall[] = pairs.map((pair) => ({
    address: pair.id,
    name: "getReserves",
  }));
  const pairV2MultiCallResult = await multicallv2<PairReserve[]>(
    IPancakePair,
    poolInfoCalls,
    {
      requireSuccess: true,
    }
  );
  return pairs.map((p, i) => {
    const pairWithPrice = p as PairWithPrice;
    const { reserve0, reserve1 } = pairV2MultiCallResult[i];
    pairWithPrice.reserve0 = FixedNumber.from(reserve0);
    pairWithPrice.reserve1 = FixedNumber.from(reserve1);
    pairWithPrice.token0price = pairWithPrice.reserve0.divUnsafe(
      pairWithPrice.reserve1
    );
    pairWithPrice.token1price = pairWithPrice.reserve1.divUnsafe(
      pairWithPrice.reserve0
    );

    return pairWithPrice;
  });
};

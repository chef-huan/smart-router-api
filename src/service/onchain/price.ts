import { Pair, PairWithPrice } from "../../model/pairs";
import { multicallv2 } from "../../utils/onchain/multicall";
import { PairReserves } from "../../model/onchain";
import PairAbi from "../../abi/Pair.json";
import { FixedNumber } from "ethers";

export const getPairPriceV2 = async (pairs: Pair[]) => {
  const poolInfoCalls = pairs.map((pair) => ({
    address: pair.id,
    name: "getReserves",
  }));
  const pairV2MultiCallResult = await multicallv2<PairReserves[]>(
    PairAbi,
    poolInfoCalls,
    {
      requireSuccess: true,
    }
  );
  console.log(pairV2MultiCallResult.length);
  console.log(pairV2MultiCallResult[0]);
  const newPairs = pairs.map((p, i) => {
    const pairWithPrice = p as PairWithPrice;
    const { _reserve0, _reserve1 } = pairV2MultiCallResult[i];
    pairWithPrice.reserve0 = FixedNumber.from(_reserve0);
    pairWithPrice.reserve1 = FixedNumber.from(_reserve1);
    pairWithPrice.token0price = pairWithPrice.reserve0.divUnsafe(
      pairWithPrice.reserve1
    );
    pairWithPrice.token1price = pairWithPrice.reserve1.divUnsafe(
      pairWithPrice.reserve0
    );

    return pairWithPrice;
  });
  console.log(newPairs[0]);
  console.log("token0price");
  console.log(newPairs[0].token0price.toString());
  console.log("token1price");
  console.log(newPairs[0].token1price.toString());
};

import { Pair, PairWithPrice } from "../../model/pairs";
import { multicallv2 } from "../../utils/onchain/multicall";
import StableSwapPairAbi from "../../abi/StableSwapPair.json";
import { BigNumber, FixedNumber } from "ethers";
import { MultiCall } from "../../model/multicall";

export const getPairPriceStableSwap = async (
  pairs: Pair[]
): Promise<PairWithPrice[]> => {
  const poolInfoCalls: MultiCall[] = pairs.flatMap((pair) => [
    {
      address: pair.id,
      name: "get_dy",
      params: ["0", "1", "1000000000000000000"],
    },
    {
      address: pair.id,
      name: "get_dy",
      params: ["1", "0", "1000000000000000000"],
    },
  ]);
  const pairStableSwapMultiCallResult = await multicallv2<BigNumber[][]>(
    StableSwapPairAbi,
    poolInfoCalls,
    {
      requireSuccess: true,
    }
  );

  return pairs.map((p, i) => {
    const pairWithPrice = p as PairWithPrice;
    pairWithPrice.token0price = FixedNumber.from(
      pairStableSwapMultiCallResult[i].toString()
    );
    pairWithPrice.token1price = FixedNumber.from(
      pairStableSwapMultiCallResult[i + 1].toString()
    );

    return pairWithPrice;
  });
};

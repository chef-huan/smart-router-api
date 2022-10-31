import { PairWithPrice } from "../../model/pairs";
import { multicallv2 } from "../../../common/utils/onchain/multicall";
import StableSwapPairAbi from "../../../abi/StableSwapPair.json";
import { BigNumber, FixedNumber } from "ethers";
import { MultiCall, Pair } from "../../../common/model";

//get_dy(0, 1, amount) means how much (token 1) you will get by swap (token 0) with amount
export const getPairPriceStableSwap = async (
  pairAddress: string,
  amountIn?: string,
  amountOut?: string
): Promise<string> => {
  const call: MultiCall = {
    address: pairAddress,
    name: "get_dy",
    params: [
      amountIn ? "0" : "1",
      amountOut ? "0" : "1",
      amountIn || amountOut,
    ],
  };

  // console.log({ call });

  const pairStableSwapMultiCallResult = await multicallv2<BigNumber[]>(
    StableSwapPairAbi,
    [call],
    {
      requireSuccess: true,
    }
  );

  return pairStableSwapMultiCallResult.toString();
};

export const getPairsPriceStableSwap = async (
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

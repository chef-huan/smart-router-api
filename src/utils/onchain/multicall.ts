import { ethers } from "ethers";
import { getMulticallContract } from "./getContract";
import { MultiCall, MultiCallOptions } from "../../model/multicall";

/**
 * Multicall V2 uses the new "tryAggregate" function. It is different in 2 ways
 *
 * 1. If "requireSuccess" is false multicall will not bail out if one of the calls fails
 * 2. The return includes a boolean whether the call was successful e.g. [wasSuccessful, callResult]
 */
export const multicallv2 = async <T>(
  abi: any[],
  calls: MultiCall[],
  options: MultiCallOptions
): Promise<T> => {
  const { requireSuccess } = options;
  const multi = getMulticallContract();
  const itf = new ethers.utils.Interface(abi);

  const calldata = calls.map((call) => ({
    target: call.address.toLowerCase(),
    callData: itf.encodeFunctionData(call.name, call.params),
  }));
  const returnData = await multi.tryAggregate(requireSuccess || true, calldata);
  const res = returnData.map((call, i) => {
    const [result, data] = call;
    return result ? itf.decodeFunctionResult(calls[i].name, data) : null;
  });

  return res as unknown as T;
};

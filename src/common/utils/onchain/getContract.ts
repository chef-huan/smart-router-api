import { ethers } from "ethers";
import MultiCallAbi from "../../../abi/Multicall.json";
import { Multicall } from "../../../abi/types";
import simpleRpcProvider from "./simpleRpcProvider";

const getContract = (abi: ethers.ContractInterface, address: string) => {
  return new ethers.Contract(address, abi, simpleRpcProvider);
};

export const getMulticallContract = () => {
  return getContract(
    MultiCallAbi,
    process.env.MULTICALL_ADDRESS as string
  ) as Multicall;
};

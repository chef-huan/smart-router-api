import { BigNumber } from "ethers";

export interface PairReserves {
  _reserve0: BigNumber;
  _reserve1: BigNumber;
  _blockTimestampLast: BigNumber;
}

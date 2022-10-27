import { BigNumber } from "ethers";

export interface PairReserve {
  reserve0: BigNumber;
  reserve1: BigNumber;
  blockTimestampLast: BigNumber;
}

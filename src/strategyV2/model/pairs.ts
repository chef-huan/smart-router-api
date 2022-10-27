import { FixedNumber } from "ethers";
import { Pair } from "../../common/model/pairs";

export interface PairWithPrice extends Pair {
  token0price: FixedNumber;
  token1price: FixedNumber;

  reserve0: FixedNumber;
  reserve1: FixedNumber;
}

export interface PairQueryResponse {
  data: Pair[];
}

import { bscTokens } from '../../strategyV1/config';
import { Token } from '@pancakeswap/sdk';
import { equalsIgnoreCase } from '../utils/helpers';

export const findTokenInConfig = (address: string): Token => {
  let found;
  for (const key of Object.keys(bscTokens)) {
    const token: Token = bscTokens[key];
    if (token && equalsIgnoreCase(token.address, address)) {
      found = token;
      break;
    }
  }
  return found;
};

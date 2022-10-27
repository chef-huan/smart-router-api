export interface Node {
  token: string; // contract address
  tokenName: string; // token name (e.g. USDC, ETH, ...)
  tokenNumDecimals: number; // token decimals (e.g. DAI: 18, USDC: 6)
}

export interface Route {
  from: Node;
  to: Node;
  price: string;
}

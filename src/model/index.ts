
export type QuoteRequest = {
  // 1 for ETH L1
  networkId: number;

  // Base token (the token the trader sells).
  baseToken: string; // contract address
  baseTokenName: string; // token name (e.g. USDC, ETH, ...)
  baseTokenNumDecimals: number; // token decimals (e.g. DAI: 18, USDC: 6)

  // Quote token (the token the trader buys).
  quoteToken: string; // contract address
  quoteTokenName: string; // token name (e.g. USDC, ETH, ...)
  quoteTokenNumDecimals: number; // token decimals (e.g. DAI: 18, USDC: 6)

  // Exactly one of the following fields will be present in the RFQ.
  // If baseTokenAmount is present, quoteTokenAmount needs to be filled by the quote.
  // If quoteTokenAmount is present, baseTokenAmount needs to be filled by the quote.
  // Amounts are in decimals, e.g. "1000000" for 1 USDT.
  baseTokenAmount?: string;
  quoteTokenAmount?: string;

  // The trader wallet address that will swap with the contract.
  trader: string;
};
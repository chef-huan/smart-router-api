export interface MultiCall {
  address: string; // Address of the contract
  name: string; // Function name on the contract (example: balanceOf)
  params?: (string | number)[]; // Function params
}

export interface MultiCallOptions {
  requireSuccess?: boolean;
}

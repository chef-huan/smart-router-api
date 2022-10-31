export enum SUBGRAPH_URL {
  NODE_REAL_V2 = "https://pancakeswap.nodereal.io/graphql",
  STREAMING_FAST_V2 = "https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2",
  STABLE_SWAP = "https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-stableswap",
  PAIRS = "https://api.thegraph.com/subgraphs/name/pancakeswap/pairs",
}

export const TOKEN_BLACKLIST = [
  // These ones are copied from v1 info
  "0x495c7f3a713870f68f8b418b355c085dfdc412c3",
  "0xc3761eb917cd790b30dad99f6cc5b4ff93c4f9ea",
  "0xe31debd7abff90b06bca21010dd860d8701fd901",
  "0xfc989fbb6b3024de5ca0144dc23c18a063942ac1",
  "0xe40fc6ff5f2895b44268fd2e1a421e07f567e007",
  "0xfd158609228b43aa380140b46fff3cdf9ad315de",
  "0xc00af6212fcf0e6fd3143e692ccd4191dc308bea",
  "0x205969b3ad459f7eba0dee07231a6357183d3fb6",
  "0x0bd67d358636fd7b0597724aa4f20beedbf3073a",
  "0xedf5d2a561e8a3cb5a846fbce24d2ccd88f50075",
  "0x702b0789a3d4dade1688a0c8b7d944e5ba80fc30",
  "0x041929a760d7049edaef0db246fa76ec975e90cc",
  "0xba098df8c6409669f5e6ec971ac02cd5982ac108",
  "0x1bbed115afe9e8d6e9255f18ef10d43ce6608d94",
  "0xe99512305bf42745fae78003428dcaf662afb35d",
  "0xbE609EAcbFca10F6E5504D39E3B113F808389056",
  "0x847daf9dfdc22d5c61c4a857ec8733ef5950e82e",
  "0xdbf8913dfe14536c0dae5dd06805afb2731f7e7b",
  // These ones are newly found
  "0xF1D50dB2C40b63D2c598e2A808d1871a40b1E653",
  "0x4269e4090ff9dfc99d8846eb0d42e67f01c3ac8b",
];
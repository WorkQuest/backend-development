import config from "./config";

/** Networks */
export const networks = {
  bsc: 'BSC',
  eth: 'ETH'
};

/** WS providers */
export const wsProviders = {
  bsc: config.contracts.wqtProviderBsctestnet,
  eth: config.contracts.wqtProviderRinkeby
};

/** Contract addresses */
export const contractAddresses = {
  bsc: config.contracts.wqtBridgeBsctestnet,
  eth: config.contracts.wqtBridgeRinkeby,
};

export const metaMaskKey = `0x${process.env.WQT_PRIVATE_KEY}`


// export const chainIds = {
//   heco: process.env.CHAIN_ID_HECO,
//   bsc: process.env.CHAIN_ID_BSC
// }

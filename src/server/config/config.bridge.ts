import { config } from 'dotenv';

config({ path: __dirname + '/../../../.env.bridge' });

export default {
  debug: process.env.BRIDGE_DEBUG === 'true',
  ethereumMainNetwork: {
    contract: process.env.BRIDGE_ETH_MAINNETWORK_CONTRACT,
    rpcProviderLink: process.env.BRIDGE_ETH_MAINNETWORK_RPC_PROVIDER,
  },
  bscMainNetwork: {
    contract: process.env.BRIDGE_BSC_MAINNETWORK_CONTRACT,
    rpcProviderLink: process.env.BRIDGE_BSC_MAINNETWORK_RPC_PROVIDER,
  },
  rinkebyTestNetwork: {
    contract: process.env.BRIDGE_RINKEBY_TESTNETWORK_CONTRACT,
    rpcProviderLink: process.env.BRIDGE_RINKEBY_TESTNETWORK_RPC_PROVIDER,
  },
  bscTestNetwork: {
    contract: process.env.BRIDGE_BSC_TESTNETWORK_CONTRACT,
    rpcProviderLink: process.env.BRIDGE_BSC_TESTNETWORK_RPC_PROVIDER,
  },
  privateKey: process.env.BRIDGE_CONTRACT_PRIVAT_KEY,
};

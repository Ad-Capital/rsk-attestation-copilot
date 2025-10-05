import { config } from 'dotenv';
import { NetworkConfig } from '../types/attestation.js';

config();

export const getNetworkConfig = (network: 'testnet' | 'mainnet'): NetworkConfig => {
  const configs: Record<string, NetworkConfig> = {
    testnet: {
      name: 'testnet',
      rpcUrl: process.env.RSK_RPC_URL_TESTNET || 'https://rpc.testnet.rootstock.io',
      rasContract: process.env.RAS_CONTRACT_TESTNET || '0xc300aeEadd60999933468738c9F5d7e9c0671e1C',
      schemaRegistry: process.env.SCHEMA_REGISTRY_TESTNET || '0x679c62956cD2801ABaBF80e9D430F18859eea2D5'
    },
    mainnet: {
      name: 'mainnet',
      rpcUrl: process.env.RSK_RPC_URL_MAINNET || 'https://rpc.mainnet.rootstock.io',
      rasContract: process.env.RAS_CONTRACT_MAINNET || '0x54c0726E9D2D57Bc37aD52C7E219a3229E0ee963',
      schemaRegistry: process.env.SCHEMA_REGISTRY_MAINNET || '0xef29675d82Cc5967069D6D9c17F2719F67728F5b'
    }
  };

  return configs[network];
};

export const getPrivateKey = (): string => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable not set');
  }
  return privateKey;
};

export const getNetwork = (): 'testnet' | 'mainnet' => {
  const network = process.env.RSK_NETWORK as 'testnet' | 'mainnet';
  return network || 'testnet';
};
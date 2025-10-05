import type { ContractTransactionResponse, TransactionReceipt } from 'ethers';

// Extended transaction type that includes EAS-specific methods
export interface EASTransaction extends ContractTransactionResponse {
  getAttestationUID?(): Promise<string>;
  getSchemaUID?(): Promise<string>;
}

export interface EASTransactionReceipt extends TransactionReceipt {
  hash: string;
  blockNumber: number;
  status: number | null;
}

export interface EASAttestation {
  uid: string;
  schema: string;
  recipient: string;
  attester: string;
  revocable: boolean;
  refUID: string;
  data: string;
  time: bigint;
  expirationTime: bigint;
  revocationTime: bigint;
}

export interface EASSchemaRegistry {
  register(
    schema: string,
    resolverAddress: string,
    revocable: boolean
  ): Promise<EASTransaction>;
}

// Type augmentation for methods that might not be in the base EAS type
export interface EASMethods {
  getSchemaRegistry(): EASSchemaRegistry | Promise<EASSchemaRegistry>;
}
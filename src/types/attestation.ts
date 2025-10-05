import { z } from 'zod';

export interface NetworkConfig {
  name: 'testnet' | 'mainnet';
  rpcUrl: string;
  rasContract: string;
  schemaRegistry: string;
}

export interface AttestationData {
  uid: string;
  schema: string;
  recipient: string;
  attester: string;
  revocable: boolean;
  refUID: string;
  data: string;
  time: number;
  expirationTime: number;
  revocationTime: number;
}

export interface SchemaData {
  uid: string;
  schema: string;
  resolver: string;
  revocable: boolean;
}

export const IssueAttestationSchema = z.object({
  network: z.enum(['testnet', 'mainnet']).describe('Blockchain network to use'),
  recipient: z.string().describe('Address receiving the attestation (0x...)'),
  schema: z.string().describe('Schema UID to use for attestation'),
  data: z.string().describe('Encoded attestation data'),
  expirationTime: z.number().optional().describe('Unix timestamp when attestation expires (0 for no expiration)'),
  revocable: z.boolean().optional().describe('Whether attestation can be revoked'),
  refUID: z.string().optional().describe('Reference to another attestation UID'),
  value: z.string().optional().describe('ETH value to send with attestation (in wei)')
});

export const VerifyAttestationSchema = z.object({
  network: z.enum(['testnet', 'mainnet']).describe('Blockchain network to query'),
  uid: z.string().describe('Attestation UID to verify')
});

export const ListAttestationsSchema = z.object({
  network: z.enum(['testnet', 'mainnet']).describe('Blockchain network to query'),
  recipient: z.string().optional().describe('Filter by recipient address'),
  attester: z.string().optional().describe('Filter by attester address'),
  schema: z.string().optional().describe('Filter by schema UID'),
  limit: z.number().optional().describe('Maximum number of results to return')
});

export const CreateSchemaSchema = z.object({
  network: z.enum(['testnet', 'mainnet']).describe('Blockchain network to use'),
  schema: z.string().describe('Schema definition string (e.g., "string name,uint256 age")'),
  resolverAddress: z.string().optional().describe('Optional resolver contract address'),
  revocable: z.boolean().describe('Whether attestations using this schema can be revoked')
});

export const RevokeAttestationSchema = z.object({
  network: z.enum(['testnet', 'mainnet']).describe('Blockchain network to use'),
  uid: z.string().describe('Attestation UID to revoke')
});

export type IssueAttestationInput = z.infer<typeof IssueAttestationSchema>;
export type VerifyAttestationInput = z.infer<typeof VerifyAttestationSchema>;
export type ListAttestationsInput = z.infer<typeof ListAttestationsSchema>;
export type CreateSchemaInput = z.infer<typeof CreateSchemaSchema>;
export type RevokeAttestationInput = z.infer<typeof RevokeAttestationSchema>;
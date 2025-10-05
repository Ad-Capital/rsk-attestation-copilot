import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { getNetworkConfig, getPrivateKey } from '../utils/config.js';
import { devLog } from '../utils/devLog.js';
import {
  NetworkConfig,
  AttestationData,
  SchemaData,
  IssueAttestationInput,
  VerifyAttestationInput,
  ListAttestationsInput,
  CreateSchemaInput,
  RevokeAttestationInput
} from '../types/attestation.js';
import { EASTransaction, EASTransactionReceipt, EASMethods } from '../types/eas.js';
import { GraphQLService } from './graphqlService.js';

export class AttestationService {
  private eas: EAS & EASMethods;
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private config: NetworkConfig;
  private graphqlService: GraphQLService;

  constructor(network: 'testnet' | 'mainnet') {
    this.config = getNetworkConfig(network);

    devLog.rpc(`Connecting to ${network} network`, { rpcUrl: this.config.rpcUrl });

    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.signer = new ethers.Wallet(getPrivateKey(), this.provider);

    this.eas = new EAS(this.config.rasContract) as EAS & EASMethods;
    this.eas.connect(this.signer);

    this.graphqlService = new GraphQLService(this.config);

    devLog.agent('AttestationService initialized', {
      network: this.config.name,
      rasContract: this.config.rasContract
    });
  }

  async issueAttestation(input: IssueAttestationInput): Promise<{ uid: string; txHash: string }> {
    try {
      devLog.agent('Issuing attestation', {
        recipient: input.recipient,
        schema: input.schema
      });

      const attestation = {
        schema: input.schema,
        data: {
          recipient: input.recipient,
          expirationTime: BigInt(input.expirationTime || 0),
          revocable: input.revocable ?? true,
          refUID: input.refUID || '0x0000000000000000000000000000000000000000000000000000000000000000',
          data: input.data,
          value: BigInt(input.value || 0)
        }
      };

      const tx = (await this.eas.attest(attestation)) as unknown as EASTransaction;
      const txHash = tx.hash || 'unknown';
      devLog.rpc('Transaction submitted', { txHash });

      // Wait for transaction confirmation
      const receipt = await tx.wait() as EASTransactionReceipt;

      // Use type assertion for EAS-specific methods
      const uid = await tx.getAttestationUID?.() || 'unknown';

      devLog.agent('Attestation issued successfully', {
        uid,
        txHash
      });

      return {
        uid,
        txHash
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      devLog.error('Failed to issue attestation', { error: errorMessage });
      throw new Error(`Failed to issue attestation: ${errorMessage}`);
    }
  }

  async verifyAttestation(input: VerifyAttestationInput): Promise<AttestationData | null> {
    try {
      devLog.agent('Verifying attestation', { uid: input.uid });

      const attestation = await this.eas.getAttestation(input.uid);

      if (!attestation || attestation.uid === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        devLog.agent('Attestation not found', { uid: input.uid });
        return null;
      }

      const result: AttestationData = {
        uid: attestation.uid,
        schema: attestation.schema,
        recipient: attestation.recipient,
        attester: attestation.attester,
        revocable: attestation.revocable,
        refUID: attestation.refUID,
        data: attestation.data,
        time: attestation.time <= Number.MAX_SAFE_INTEGER
          ? Number(attestation.time)
          : Number.MAX_SAFE_INTEGER,
        expirationTime: attestation.expirationTime <= Number.MAX_SAFE_INTEGER
          ? Number(attestation.expirationTime)
          : Number.MAX_SAFE_INTEGER,
        revocationTime: attestation.revocationTime <= Number.MAX_SAFE_INTEGER
          ? Number(attestation.revocationTime)
          : Number.MAX_SAFE_INTEGER
      };

      devLog.agent('Attestation verified', {
        uid: result.uid,
        attester: result.attester,
        isRevoked: result.revocationTime > 0
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      devLog.error('Failed to verify attestation', { error: errorMessage });
      throw new Error(`Failed to verify attestation: ${errorMessage}`);
    }
  }

  async listAttestations(input: ListAttestationsInput): Promise<AttestationData[]> {
    try {
      devLog.agent('Listing attestations', {
        recipient: input.recipient,
        attester: input.attester,
        schema: input.schema
      });

      // Use GraphQL service for efficient querying
      const attestations = await this.graphqlService.queryAttestations({
        recipient: input.recipient,
        attester: input.attester,
        schema: input.schema,
        limit: input.limit
      });

      devLog.agent('Attestations retrieved via GraphQL', {
        count: attestations.length,
        network: this.config.name
      });

      return attestations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      devLog.error('Failed to list attestations', { error: errorMessage });
      throw new Error(`Failed to list attestations: ${errorMessage}`);
    }
  }

  async createSchema(input: CreateSchemaInput): Promise<{ uid: string; txHash: string }> {
    try {
      devLog.agent('Creating schema', { schema: input.schema });

      const schemaRegistry = await Promise.resolve(this.eas.getSchemaRegistry());

      const tx = (await schemaRegistry.register(
        input.schema,
        input.resolverAddress || '0x0000000000000000000000000000000000000000',
        input.revocable
      )) as unknown as EASTransaction;

      const schemaTxHash = tx.hash || 'unknown';
      devLog.rpc('Schema transaction submitted', { txHash: schemaTxHash });

      // Wait for transaction confirmation
      const receipt = await tx.wait() as EASTransactionReceipt;

      // Get schema UID from transaction logs
      const uid = await tx.getSchemaUID?.() || 'unknown';

      devLog.agent('Schema created successfully', {
        uid,
        txHash: schemaTxHash,
        schema: input.schema
      });

      return {
        uid,
        txHash: schemaTxHash
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      devLog.error('Failed to create schema', { error: errorMessage });
      throw new Error(`Failed to create schema: ${errorMessage}`);
    }
  }

  async revokeAttestation(input: RevokeAttestationInput): Promise<{ txHash: string }> {
    try {
      devLog.agent('Revoking attestation', { uid: input.uid });

      // First, get the attestation to retrieve its schema
      const attestation = await this.eas.getAttestation(input.uid);
      if (!attestation || attestation.uid === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        throw new Error(`Attestation ${input.uid} not found`);
      }

      devLog.agent('Retrieved attestation for revocation', {
        uid: input.uid,
        schema: attestation.schema
      });

      const tx = (await this.eas.revoke({
        schema: attestation.schema,
        data: {
          uid: input.uid,
          value: BigInt(0)
        }
      })) as unknown as EASTransaction;

      const revokeTxHash = tx.hash || 'unknown';
      devLog.rpc('Revocation transaction submitted', { txHash: revokeTxHash });

      // Wait for transaction confirmation
      const receipt = await tx.wait() as EASTransactionReceipt;

      devLog.agent('Attestation revoked successfully', {
        uid: input.uid,
        txHash: revokeTxHash
      });

      return {
        txHash: revokeTxHash
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      devLog.error('Failed to revoke attestation', { error: errorMessage });
      throw new Error(`Failed to revoke attestation: ${errorMessage}`);
    }
  }
}
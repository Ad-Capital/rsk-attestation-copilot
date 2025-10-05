import { AttestationService } from '../services/attestationService.js';
import { devLog } from '../utils/devLog.js';
import {
  IssueAttestationInput,
  VerifyAttestationInput,
  ListAttestationsInput,
  CreateSchemaInput,
  RevokeAttestationInput
} from '../types/attestation.js';

export const handleIssueAttestation = async (args: IssueAttestationInput) => {
  try {
    devLog.cli('Issue attestation command received', {
      recipient: args.recipient,
      network: args.network
    });

    const service = new AttestationService(args.network);
    const result = await service.issueAttestation(args);

    return {
      success: true,
      message: 'Attestation issued successfully',
      data: {
        uid: result.uid,
        txHash: result.txHash,
        network: args.network,
        recipient: args.recipient,
        schema: args.schema
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    devLog.error('Issue attestation handler failed', { error: errorMessage });
    return {
      success: false,
      message: `Failed to issue attestation: ${errorMessage}`,
      data: null
    };
  }
};

export const handleVerifyAttestation = async (args: VerifyAttestationInput) => {
  try {
    devLog.cli('Verify attestation command received', {
      uid: args.uid,
      network: args.network
    });

    const service = new AttestationService(args.network);
    const attestation = await service.verifyAttestation(args);

    if (!attestation) {
      return {
        success: false,
        message: 'Attestation not found',
        data: null
      };
    }

    const isValid = attestation.revocationTime === 0;
    const isExpired = attestation.expirationTime > 0 &&
                     attestation.expirationTime < Math.floor(Date.now() / 1000);

    return {
      success: true,
      message: `Attestation ${isValid && !isExpired ? 'is valid' : 'is invalid/expired'}`,
      data: {
        ...attestation,
        isValid: isValid && !isExpired,
        isRevoked: attestation.revocationTime > 0,
        isExpired
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    devLog.error('Verify attestation handler failed', { error: errorMessage });
    return {
      success: false,
      message: `Failed to verify attestation: ${errorMessage}`,
      data: null
    };
  }
};

export const handleListAttestations = async (args: ListAttestationsInput) => {
  try {
    devLog.cli('List attestations command received', {
      network: args.network,
      recipient: args.recipient,
      attester: args.attester
    });

    const service = new AttestationService(args.network);
    const attestations = await service.listAttestations(args);

    return {
      success: true,
      message: `Found ${attestations.length} attestations`,
      data: {
        attestations,
        count: attestations.length,
        network: args.network
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    devLog.error('List attestations handler failed', { error: errorMessage });
    return {
      success: false,
      message: `Failed to list attestations: ${errorMessage}`,
      data: null
    };
  }
};

export const handleCreateSchema = async (args: CreateSchemaInput) => {
  try {
    devLog.cli('Create schema command received', {
      network: args.network,
      schema: args.schema
    });

    const service = new AttestationService(args.network);
    const result = await service.createSchema(args);

    return {
      success: true,
      message: 'Schema created successfully',
      data: {
        uid: result.uid,
        txHash: result.txHash,
        network: args.network,
        schema: args.schema,
        revocable: args.revocable
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    devLog.error('Create schema handler failed', { error: errorMessage });
    return {
      success: false,
      message: `Failed to create schema: ${errorMessage}`,
      data: null
    };
  }
};

export const handleRevokeAttestation = async (args: RevokeAttestationInput) => {
  try {
    devLog.cli('Revoke attestation command received', {
      uid: args.uid,
      network: args.network
    });

    const service = new AttestationService(args.network);
    const result = await service.revokeAttestation(args);

    return {
      success: true,
      message: 'Attestation revoked successfully',
      data: {
        uid: args.uid,
        txHash: result.txHash,
        network: args.network
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    devLog.error('Revoke attestation handler failed', { error: errorMessage });
    return {
      success: false,
      message: `Failed to revoke attestation: ${errorMessage}`,
      data: null
    };
  }
};
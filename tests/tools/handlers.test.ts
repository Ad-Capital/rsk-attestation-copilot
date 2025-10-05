import {
  handleIssueAttestation,
  handleVerifyAttestation,
  handleCreateSchema
} from '../../src/tools/handlers.js';
import { AttestationService } from '../../src/services/attestationService.js';

// Mock the AttestationService
jest.mock('../../src/services/attestationService.js');

const mockAttestationService = AttestationService as jest.MockedClass<typeof AttestationService>;

describe('Attestation Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the service instance methods
    const mockInstance = {
      issueAttestation: jest.fn(),
      verifyAttestation: jest.fn(),
      createSchema: jest.fn(),
      listAttestations: jest.fn(),
      revokeAttestation: jest.fn()
    };

    mockAttestationService.mockImplementation(() => mockInstance as any);
  });

  describe('handleIssueAttestation', () => {
    it('should handle successful attestation issuance', async () => {
      const mockResult = {
        uid: '0xmockuid',
        txHash: '0xmocktx'
      };

      const mockInstance = new mockAttestationService('testnet');
      (mockInstance.issueAttestation as jest.Mock).mockResolvedValue(mockResult);

      const input = {
        network: 'testnet' as const,
        recipient: '0x1234567890123456789012345678901234567890',
        schema: '0xmockschema',
        data: '0xmockdata'
      };

      const result = await handleIssueAttestation(input);

      expect(result).toEqual({
        success: true,
        message: 'Attestation issued successfully',
        data: {
          uid: '0xmockuid',
          txHash: '0xmocktx',
          network: 'testnet',
          recipient: '0x1234567890123456789012345678901234567890',
          schema: '0xmockschema'
        }
      });
    });

    it('should handle attestation issuance errors', async () => {
      const mockInstance = new mockAttestationService('testnet');
      (mockInstance.issueAttestation as jest.Mock).mockRejectedValue(new Error('Network error'));

      const input = {
        network: 'testnet' as const,
        recipient: '0x1234567890123456789012345678901234567890',
        schema: '0xmockschema',
        data: '0xmockdata'
      };

      const result = await handleIssueAttestation(input);

      expect(result).toEqual({
        success: false,
        message: 'Failed to issue attestation: Network error',
        data: null
      });
    });
  });

  describe('handleVerifyAttestation', () => {
    it('should handle successful attestation verification', async () => {
      const mockAttestation = {
        uid: '0xmockuid',
        schema: '0xmockschema',
        recipient: '0x1234567890123456789012345678901234567890',
        attester: '0x0987654321098765432109876543210987654321',
        revocable: true,
        refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
        data: '0xmockdata',
        time: 1640995200,
        expirationTime: 0,
        revocationTime: 0
      };

      const mockInstance = new mockAttestationService('testnet');
      (mockInstance.verifyAttestation as jest.Mock).mockResolvedValue(mockAttestation);

      const input = {
        network: 'testnet' as const,
        uid: '0xmockuid'
      };

      const result = await handleVerifyAttestation(input);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Attestation is valid');
      expect(result.data?.isValid).toBe(true);
      expect(result.data?.isRevoked).toBe(false);
      expect(result.data?.isExpired).toBe(false);
    });

    it('should handle non-existent attestation', async () => {
      const mockInstance = new mockAttestationService('testnet');
      (mockInstance.verifyAttestation as jest.Mock).mockResolvedValue(null);

      const input = {
        network: 'testnet' as const,
        uid: '0xnonexistent'
      };

      const result = await handleVerifyAttestation(input);

      expect(result).toEqual({
        success: false,
        message: 'Attestation not found',
        data: null
      });
    });

    it('should detect revoked attestations', async () => {
      const mockAttestation = {
        uid: '0xmockuid',
        schema: '0xmockschema',
        recipient: '0x1234567890123456789012345678901234567890',
        attester: '0x0987654321098765432109876543210987654321',
        revocable: true,
        refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
        data: '0xmockdata',
        time: 1640995200,
        expirationTime: 0,
        revocationTime: 1641000000 // Revoked
      };

      const mockInstance = new mockAttestationService('testnet');
      (mockInstance.verifyAttestation as jest.Mock).mockResolvedValue(mockAttestation);

      const input = {
        network: 'testnet' as const,
        uid: '0xmockuid'
      };

      const result = await handleVerifyAttestation(input);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Attestation is invalid/expired');
      expect(result.data?.isValid).toBe(false);
      expect(result.data?.isRevoked).toBe(true);
    });
  });

  describe('handleCreateSchema', () => {
    it('should handle successful schema creation', async () => {
      const mockResult = {
        uid: '0xmockschemauid',
        txHash: '0xmockschematx'
      };

      const mockInstance = new mockAttestationService('testnet');
      (mockInstance.createSchema as jest.Mock).mockResolvedValue(mockResult);

      const input = {
        network: 'testnet' as const,
        schema: 'string name,uint256 age',
        revocable: true
      };

      const result = await handleCreateSchema(input);

      expect(result).toEqual({
        success: true,
        message: 'Schema created successfully',
        data: {
          uid: '0xmockschemauid',
          txHash: '0xmockschematx',
          network: 'testnet',
          schema: 'string name,uint256 age',
          revocable: true
        }
      });
    });
  });
});
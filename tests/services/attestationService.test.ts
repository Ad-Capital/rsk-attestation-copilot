import { AttestationService } from '../../src/services/attestationService.js';
import { IssueAttestationInput, VerifyAttestationInput } from '../../src/types/attestation.js';

// Mock ethers and EAS SDK
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getNetwork: jest.fn().mockResolvedValue({ chainId: 31 })
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      address: '0x1234567890123456789012345678901234567890',
      connect: jest.fn()
    }))
  }
}));

jest.mock('@ethereum-attestation-service/eas-sdk', () => ({
  EAS: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    attest: jest.fn().mockResolvedValue({
      hash: '0xmocktxhash',
      wait: jest.fn().mockResolvedValue({
        hash: '0xmocktxhash',
        blockNumber: 12345
      }),
      getAttestationUID: jest.fn().mockResolvedValue('0xmockattestationuid')
    }),
    getAttestation: jest.fn().mockResolvedValue({
      uid: '0xmockattestationuid',
      schema: '0xmockschema',
      recipient: '0x1234567890123456789012345678901234567890',
      attester: '0x0987654321098765432109876543210987654321',
      revocable: true,
      refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
      data: '0xmockdata',
      time: 1640995200,
      expirationTime: 0,
      revocationTime: 0
    }),
    revoke: jest.fn().mockResolvedValue({
      hash: '0xmockrevokehash',
      wait: jest.fn().mockResolvedValue({
        hash: '0xmockrevokehash'
      })
    }),
    getSchemaRegistry: jest.fn().mockReturnValue({
      register: jest.fn().mockResolvedValue({
        hash: '0xmockschematxhash',
        wait: jest.fn().mockResolvedValue({
          hash: '0xmockschematxhash'
        }),
        getSchemaUID: jest.fn().mockResolvedValue('0xmockschemauid')
      })
    })
  })),
  SchemaEncoder: jest.fn().mockImplementation(() => ({
    encodeData: jest.fn().mockReturnValue('0xmockencodeddata')
  }))
}));

describe('AttestationService', () => {
  let service: AttestationService;

  beforeEach(() => {
    service = new AttestationService('testnet');
  });

  describe('issueAttestation', () => {
    it('should issue an attestation successfully', async () => {
      const input: IssueAttestationInput = {
        network: 'testnet',
        recipient: '0x1234567890123456789012345678901234567890',
        schema: '0xmockschema',
        data: '0xmockdata'
      };

      const result = await service.issueAttestation(input);

      expect(result).toEqual({
        uid: '0xmockattestationuid',
        txHash: '0xmocktxhash'
      });
    });

    it('should handle attestation errors gracefully', async () => {
      const input: IssueAttestationInput = {
        network: 'testnet',
        recipient: '0x1234567890123456789012345678901234567890',
        schema: '0xmockschema',
        data: '0xmockdata'
      };

      // Mock a failure
      const mockEAS = service['eas'];
      mockEAS.attest = jest.fn().mockRejectedValue(new Error('Transaction failed'));

      await expect(service.issueAttestation(input)).rejects.toThrow('Failed to issue attestation: Transaction failed');
    });
  });

  describe('verifyAttestation', () => {
    it('should verify an existing attestation', async () => {
      const input: VerifyAttestationInput = {
        network: 'testnet',
        uid: '0xmockattestationuid'
      };

      const result = await service.verifyAttestation(input);

      expect(result).toEqual({
        uid: '0xmockattestationuid',
        schema: '0xmockschema',
        recipient: '0x1234567890123456789012345678901234567890',
        attester: '0x0987654321098765432109876543210987654321',
        revocable: true,
        refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
        data: '0xmockdata',
        time: 1640995200,
        expirationTime: 0,
        revocationTime: 0
      });
    });

    it('should return null for non-existent attestation', async () => {
      const input: VerifyAttestationInput = {
        network: 'testnet',
        uid: '0xnonexistent'
      };

      // Mock non-existent attestation
      const mockEAS = service['eas'];
      mockEAS.getAttestation = jest.fn().mockResolvedValue({
        uid: '0x0000000000000000000000000000000000000000000000000000000000000000'
      });

      const result = await service.verifyAttestation(input);

      expect(result).toBeNull();
    });
  });

  describe('createSchema', () => {
    it('should create a schema successfully', async () => {
      const input = {
        network: 'testnet' as const,
        schema: 'string name,uint256 age',
        revocable: true
      };

      const result = await service.createSchema(input);

      expect(result).toEqual({
        uid: '0xmockschemauid',
        txHash: '0xmockschematxhash'
      });
    });
  });

  describe('revokeAttestation', () => {
    it('should revoke an attestation successfully', async () => {
      const input = {
        network: 'testnet' as const,
        uid: '0xmockattestationuid'
      };

      const result = await service.revokeAttestation(input);

      expect(result).toEqual({
        txHash: '0xmockrevokehash'
      });
    });
  });
});
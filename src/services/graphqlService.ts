import { devLog } from '../utils/devLog.js';
import { NetworkConfig, AttestationData } from '../types/attestation.js';

interface GraphQLResponse {
  data?: {
    attestations: GraphQLAttestation[];
  };
  errors?: Array<{ message: string }>;
}

interface GraphQLAttestation {
  id: string;
  attester: string;
  recipient: string;
  revoked: boolean;
  revocable: boolean;
  refUID: string;
  data: string;
  timeCreated: string;
  expirationTime: string;
  revocationTime: string;
  schema: {
    id: string;
  };
}

export class GraphQLService {
  private config: NetworkConfig;

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  private getGraphQLEndpoint(): string {
    return this.config.name === 'testnet'
      ? process.env.GRAPHQL_ENDPOINT_TESTNET || 'https://easscan-testnet.rootstock.io/graphql'
      : process.env.GRAPHQL_ENDPOINT_MAINNET || 'https://easscan.rootstock.io/graphql';
  }

  async queryAttestations(filters: {
    recipient?: string;
    attester?: string;
    schema?: string;
    limit?: number;
  }): Promise<AttestationData[]> {
    try {
      const endpoint = this.getGraphQLEndpoint();

      devLog.rpc('Querying GraphQL for attestations', {
        endpoint,
        filters
      });

      const query = `
        query GetAttestations($recipient: String, $attester: String, $schema: String, $limit: Int) {
          attestations(
            where: {
              ${filters.recipient ? 'recipient: $recipient,' : ''}
              ${filters.attester ? 'attester: $attester,' : ''}
              ${filters.schema ? 'schemaId: $schema,' : ''}
            }
            first: $limit
            orderBy: timeCreated
            orderDirection: desc
          ) {
            id
            attester
            recipient
            revoked
            revocable
            refUID
            data
            timeCreated
            expirationTime
            revocationTime
            schema {
              id
            }
          }
        }
      `;

      const variables = {
        recipient: filters.recipient,
        attester: filters.attester,
        schema: filters.schema,
        limit: filters.limit || 10
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let httpResponse: Response;
      try {
        httpResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, variables }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!httpResponse.ok) {
        throw new Error(`HTTP ${httpResponse.status}: ${httpResponse.statusText}`);
      }

      const response: GraphQLResponse = await httpResponse.json();

      if (response.errors) {
        throw new Error(`GraphQL errors: ${response.errors.map(e => e.message).join(', ')}`);
      }

      if (!response.data) {
        throw new Error('No data returned from GraphQL query');
      }

      // Transform GraphQL response to AttestationData format
      const attestations: AttestationData[] = response.data.attestations.map(gqlAttestation => {
        const timeCreated = parseInt(gqlAttestation.timeCreated, 10);
        const expirationTime = parseInt(gqlAttestation.expirationTime, 10);
        const revocationTime = parseInt(gqlAttestation.revocationTime, 10);

        if (isNaN(timeCreated) || isNaN(expirationTime) || isNaN(revocationTime)) {
          throw new Error(`Invalid time value in attestation data for UID ${gqlAttestation.id}`);
        }

        return {
          uid: gqlAttestation.id,
          schema: gqlAttestation.schema.id,
          recipient: gqlAttestation.recipient,
          attester: gqlAttestation.attester,
          revocable: gqlAttestation.revocable,
          refUID: gqlAttestation.refUID,
          data: gqlAttestation.data,
          time: timeCreated <= Number.MAX_SAFE_INTEGER ? timeCreated : Number.MAX_SAFE_INTEGER,
          expirationTime: expirationTime <= Number.MAX_SAFE_INTEGER ? expirationTime : Number.MAX_SAFE_INTEGER,
          revocationTime: revocationTime <= Number.MAX_SAFE_INTEGER ? revocationTime : Number.MAX_SAFE_INTEGER
        };
      });

      devLog.agent('GraphQL query completed', {
        resultCount: attestations.length,
        endpoint
      });

      return attestations;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown GraphQL error';
      devLog.error('GraphQL query failed', { error: errorMessage });
      throw new Error(`GraphQL query failed: ${errorMessage}`);
    }
  }

  async queryAttestationsByUID(uid: string): Promise<AttestationData | null> {
    try {
      const endpoint = this.getGraphQLEndpoint();

      const query = `
        query GetAttestation($uid: String!) {
          attestation(id: $uid) {
            id
            attester
            recipient
            revoked
            revocable
            refUID
            data
            timeCreated
            expirationTime
            revocationTime
            schema {
              id
            }
          }
        }
      `;

      devLog.rpc('Querying single attestation via GraphQL', { uid, endpoint });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let httpResponse: Response;
      try {
        httpResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, variables: { uid } }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!httpResponse.ok) {
        throw new Error(`HTTP ${httpResponse.status}: ${httpResponse.statusText}`);
      }

      const response: { data?: { attestation: GraphQLAttestation | null } } = await httpResponse.json();

      if (!response.data?.attestation) {
        return null;
      }

      const gqlAttestation = response.data.attestation;
      const timeCreated = parseInt(gqlAttestation.timeCreated, 10);
      const expirationTime = parseInt(gqlAttestation.expirationTime, 10);
      const revocationTime = parseInt(gqlAttestation.revocationTime, 10);

      if (isNaN(timeCreated) || isNaN(expirationTime) || isNaN(revocationTime)) {
        throw new Error(`Invalid time value in attestation data for UID ${gqlAttestation.id}`);
      }

      return {
        uid: gqlAttestation.id,
        schema: gqlAttestation.schema.id,
        recipient: gqlAttestation.recipient,
        attester: gqlAttestation.attester,
        revocable: gqlAttestation.revocable,
        refUID: gqlAttestation.refUID,
        data: gqlAttestation.data,
        time: timeCreated <= Number.MAX_SAFE_INTEGER ? timeCreated : Number.MAX_SAFE_INTEGER,
        expirationTime: expirationTime <= Number.MAX_SAFE_INTEGER ? expirationTime : Number.MAX_SAFE_INTEGER,
        revocationTime: revocationTime <= Number.MAX_SAFE_INTEGER ? revocationTime : Number.MAX_SAFE_INTEGER
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown GraphQL error';
      devLog.error('GraphQL attestation query failed', { error: errorMessage });
      throw new Error(`GraphQL attestation query failed: ${errorMessage}`);
    }
  }
}
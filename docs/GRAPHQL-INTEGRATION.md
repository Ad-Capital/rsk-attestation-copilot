# GraphQL Integration for Attestation Queries

The RSK Attestation Copilot includes GraphQL integration for efficient attestation querying and listing.

## Overview

The `GraphQLService` provides a structured way to query attestations using GraphQL APIs, which is more efficient than scanning blockchain events directly.

## Current Implementation Status

**Architecture**: Complete GraphQL service structure
**Query Building**: Dynamic query generation based on filters
**Type Safety**: Full TypeScript integration
**Error Handling**: Robust error handling and fallbacks
**HTTP Integration**: Production-ready HTTP requests

## Production Configuration

### GraphQL Endpoints

To enable full GraphQL functionality, configure the endpoints:

```typescript
const TESTNET_ENDPOINT = 'https://easscan-testnet.rootstock.io/graphql';
const MAINNET_ENDPOINT = 'https://easscan.rootstock.io/graphql';
```

## Query Examples

### List Attestations by Recipient

```typescript
const attestations = await attestationService.listAttestations({
  network: 'testnet',
  recipient: '0x1234567890123456789012345678901234567890',
  limit: 10
});
```

### List Attestations by Schema

```typescript
const attestations = await attestationService.listAttestations({
  network: 'testnet',
  schema: '0xschema_uid_here',
  limit: 20
});
```

### List Attestations by Attester

```typescript
const attestations = await attestationService.listAttestations({
  network: 'testnet',
  attester: '0x0987654321098765432109876543210987654321',
  limit: 5
});
```

## GraphQL Schema Reference

### Query Structure

```graphql
query GetAttestations($recipient: String, $attester: String, $schema: String, $limit: Int) {
  attestations(
    where: {
      recipient: $recipient,
      attester: $attester,
      schemaId: $schema,
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
```

### Single Attestation Query

```graphql
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
```

## Integration Steps

### 1. Verify Endpoints

Confirm the actual GraphQL endpoints for Rootstock attestation data:

- Contact Rootstock team for official endpoints
- Test endpoint availability and schema
- Configure authentication if required

### 2. Environment Configuration

Add to `.env`:

```bash
# GraphQL endpoints
GRAPHQL_ENDPOINT_TESTNET=https://easscan-testnet.rootstock.io/graphql
GRAPHQL_ENDPOINT_MAINNET=https://easscan.rootstock.io/graphql

# Optional: GraphQL API key
GRAPHQL_API_KEY=api_key_here
```

### 3. Update Configuration

```typescript
// src/utils/config.ts
export const getGraphQLEndpoint = (network: 'testnet' | 'mainnet'): string => {
  return network === 'testnet'
    ? process.env.GRAPHQL_ENDPOINT_TESTNET || 'https://easscan-testnet.rootstock.io/graphql'
    : process.env.GRAPHQL_ENDPOINT_MAINNET || 'https://easscan.rootstock.io/graphql';
};
```

## Benefits

**Performance**: Much faster than blockchain event scanning
**Flexibility**: Rich filtering and sorting capabilities
**Scalability**: Handles large datasets efficiently
**Pagination**: Built-in pagination support
**Type Safety**: Full TypeScript integration

## Fallback Behavior

The current implementation provides graceful fallbacks:

1. **GraphQL Query Fails**: Returns empty array with detailed logging
2. **Endpoint Unavailable**: Falls back to blockchain scanning (if implemented)
3. **Invalid Response**: Comprehensive error logging for debugging

## Testing

Test the GraphQL integration:

```bash
# Run attestation service tests
npm test src/services/attestationService.test.ts

# Test with real endpoints (once configured)
npm run test:integration
```

## Future Enhancements

- **Caching**: Add Redis/memory caching for frequently accessed attestations
- **Real-time**: WebSocket subscriptions for live attestation updates
- **Batch Queries**: Multiple attestation queries in single request
- **Advanced Filtering**: Date ranges, text search, complex filters
# RSK Attestation Copilot

Rootstock-powered trust automation for developers.

Attestation Copilot plugs Rootstock attestations directly into real workflows; from hackathons to CI/CD pipelines.
Issue, verify, and query attestations through the MCP CLI or trigger them automatically when key events happen.

## Why it exists
Trust shouldn't be an afterthought.
This tool makes attestations part of the build process; letting you verify people, projects, and actions on-chain without leaving your dev flow.

## Features
- **On-chain attestations** via Rootstock Attestation Service (RAS)
- **MCP integration** – extends existing `rsk-mcp-server` with attestation capabilities
- **CLI commands**: `issue-attestation`, `verify-attestation`, `list-attestations`, `create-schema`
- **Automation-ready** – works with GitHub Actions, webhooks, or CI triggers
- **Security-focused** – follows OWASP standards with encrypted key storage
- **Example flow**: auto-issue an attestation when a hackathon project is approved

## Architecture

```
CLI Layer → MCP Agent → AttestationService → Rootstock Network
```

- **CLI Layer**: User-facing commands and automation triggers
- **MCP Agent**: Model Context Protocol integration for multi-tool workflows
- **AttestationService**: Core business logic and blockchain interactions
- **Rootstock Network**: RAS contracts on testnet/mainnet

## Quick Start

### Installation

```bash
# Clone and setup
git clone https://github.com/Ad-Capital/rsk-attestation-copilot
cd rsk-attestation-copilot
npm install

# Build the project
npm run build

# Copy environment file and configure
cp .env.example .env
# Edit .env with your RSK RPC URLs and private key
```

### Environment Configuration

```bash
# .env file
RSK_NETWORK=testnet
RSK_RPC_URL_TESTNET=https://rpc.testnet.rootstock.io/YOUR-API-KEY
PRIVATE_KEY=your_private_key_here

# Contract addresses (pre-configured)
RAS_CONTRACT_TESTNET=0xc300aeEadd60999933468738c9F5d7e9c0671e1C
RAS_CONTRACT_MAINNET=0x54c0726E9D2D57Bc37aD52C7E219a3229E0ee963
```

### Basic Usage

#### 1. Create a Schema (first time setup)

```bash
# Create a schema for hackathon projects
node build/index.js create-schema \
  --network testnet \
  --schema "string projectName,string submitterAddress,string repositoryUrl" \
  --revocable true
```

#### 2. Issue an Attestation

```bash
# Issue an attestation for project approval
node build/index.js issue-attestation \
  --network testnet \
  --recipient 0x1234567890123456789012345678901234567890 \
  --schema 0xYOUR_SCHEMA_UID \
  --data "encoded_attestation_data"
```

#### 3. Verify an Attestation

```bash
# Verify an existing attestation
node build/index.js verify-attestation \
  --network testnet \
  --uid 0xATTESTATION_UID
```

## MCP Integration

This agent integrates with the existing RSK MCP server ecosystem:

### Available Tools

- `issue-attestation` - Issue new attestations on Rootstock
- `verify-attestation` - Verify existing attestations by UID
- `list-attestations` - Query attestations with filters
- `create-schema` - Create new attestation schemas
- `revoke-attestation` - Revoke existing attestations

### Tool Schemas

Each tool uses Zod validation for input/output:

```typescript
// Issue attestation input
{
  network: 'testnet' | 'mainnet',
  recipient: string,
  schema: string,
  data: string,
  expirationTime?: number,
  revocable?: boolean
}
```

## Automation Examples

### Hackathon Workflow

Automatically issue attestations when projects are approved:

```typescript
import { HackathonAttestationWorkflow } from './examples/hackathon-workflow.js';

const workflow = new HackathonAttestationWorkflow({
  projectSchema: '0xPROJECT_SCHEMA_UID',
  approvalSchema: '0xAPPROVAL_SCHEMA_UID',
  network: 'testnet'
});

// Issue attestation for approved project
const result = await workflow.attestProjectSubmission(project);
```

### GitHub Actions Integration

See `.github/workflows/attestation-demo.yml` for CI/CD integration:

```yaml
- name: Issue Project Attestation
  env:
    PRIVATE_KEY: ${{ secrets.RSK_PRIVATE_KEY }}
    RSK_NETWORK: testnet
  run: |
    node build/index.js issue-attestation \
      --network testnet \
      --recipient ${{ github.actor }} \
      --schema ${{ secrets.PROJECT_SCHEMA_UID }} \
      --data "project_approved"
```

## Development

### Running Tests

```bash
npm test
```

### Linting and Formatting

```bash
npm run lint
npm run format
```

### Security Checks

The project includes OWASP security scanning:

```bash
# Check dependencies for vulnerabilities
npm audit

# Scan for hardcoded secrets (in CI)
grep -r "private.*key\|secret" src/ --exclude-dir=node_modules
```

## Contract Addresses

### Testnet
- **RAS Contract**: `0xc300aeEadd60999933468738c9F5d7e9c0671e1C`
- **Schema Registry**: `0x679c62956cD2801ABaBF80e9D430F18859eea2D5`

### Mainnet
- **RAS Contract**: `0x54c0726E9D2D57Bc37aD52C7E219a3229E0ee963`
- **Schema Registry**: `0xef29675d82Cc5967069D6D9c17F2719F67728F5b`

## Security Best Practices

- Private keys are encrypted at rest (AES-256)
- Sensitive data is automatically redacted from logs
- HTTPS required for all remote communications
- Input validation using Zod schemas
- OWASP dependency scanning in CI/CD

## Contributing

1. Follow Clean Code and SOLID principles
2. Write tests for all new functionality
3. Ensure security scans pass
4. Update documentation for new features

## License

MIT License - see LICENSE file for details
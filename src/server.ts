import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { devLog } from './utils/devLog.js';
import {
  IssueAttestationSchema,
  VerifyAttestationSchema,
  ListAttestationsSchema,
  CreateSchemaSchema,
  RevokeAttestationSchema
} from './types/attestation.js';
import {
  handleIssueAttestation,
  handleVerifyAttestation,
  handleListAttestations,
  handleCreateSchema,
  handleRevokeAttestation
} from './tools/handlers.js';

export const createAttestationServer = (): Server => {
  const server = new Server(
    {
      name: 'rsk-attestation-copilot',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    devLog.agent('Listing available attestation tools');

    return {
      tools: [
        {
          name: 'issue-attestation',
          description: 'Issue a new attestation on Rootstock network using RAS',
          inputSchema: IssueAttestationSchema,
        },
        {
          name: 'verify-attestation',
          description: 'Verify an existing attestation by UID',
          inputSchema: VerifyAttestationSchema,
        },
        {
          name: 'list-attestations',
          description: 'List attestations with optional filters',
          inputSchema: ListAttestationsSchema,
        },
        {
          name: 'create-schema',
          description: 'Create a new attestation schema',
          inputSchema: CreateSchemaSchema,
        },
        {
          name: 'revoke-attestation',
          description: 'Revoke an existing attestation',
          inputSchema: RevokeAttestationSchema,
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    devLog.agent(`Tool called: ${name}`, { args });

    try {
      switch (name) {
        case 'issue-attestation': {
          const parsedArgs = IssueAttestationSchema.parse(args);
          const result = await handleIssueAttestation(parsedArgs);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'verify-attestation': {
          const parsedArgs = VerifyAttestationSchema.parse(args);
          const result = await handleVerifyAttestation(parsedArgs);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'list-attestations': {
          const parsedArgs = ListAttestationsSchema.parse(args);
          const result = await handleListAttestations(parsedArgs);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'create-schema': {
          const parsedArgs = CreateSchemaSchema.parse(args);
          const result = await handleCreateSchema(parsedArgs);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'revoke-attestation': {
          const parsedArgs = RevokeAttestationSchema.parse(args);
          const result = await handleRevokeAttestation(parsedArgs);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          devLog.error(`Unknown tool: ${name}`);
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      devLog.error(`Tool execution failed: ${name}`, { error: errorMessage });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: `Tool execution failed: ${errorMessage}`,
              data: null
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
};

export const runServer = async () => {
  const server = createAttestationServer();
  const transport = new StdioServerTransport();

  devLog.agent('Starting RSK Attestation Copilot MCP server');

  await server.connect(transport);
  devLog.agent('Server connected and running');
};
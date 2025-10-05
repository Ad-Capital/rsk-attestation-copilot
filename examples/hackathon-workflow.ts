import { AttestationService } from '../src/services/attestationService.js';
import { devLog } from '../src/utils/devLog.js';

interface HackathonProject {
  id: string;
  name: string;
  submitter: string;
  repositoryUrl: string;
  description: string;
  approved: boolean;
  reviewedBy: string;
}

interface AttestationWorkflow {
  projectSchema: string;
  approvalSchema: string;
  network: 'testnet' | 'mainnet';
}

export class HackathonAttestationWorkflow {
  private attestationService: AttestationService;
  private config: AttestationWorkflow;

  constructor(config: AttestationWorkflow) {
    this.config = config;
    this.attestationService = new AttestationService(config.network);
  }

  updateSchemas(projectSchema: string, approvalSchema: string): void {
    this.config.projectSchema = projectSchema;
    this.config.approvalSchema = approvalSchema;
  }

  async createProjectSubmissionSchema(): Promise<string> {
    devLog.workflow('Creating hackathon project submission schema');

    const schemaDefinition = 'string projectName,string submitterAddress,string repositoryUrl,string description,uint256 submissionTime';

    const result = await this.attestationService.createSchema({
      network: this.config.network,
      schema: schemaDefinition,
      revocable: false
    });

    devLog.workflow('Project submission schema created', {
      uid: result.uid,
      txHash: result.txHash
    });

    return result.uid;
  }

  async createApprovalSchema(): Promise<string> {
    devLog.workflow('Creating hackathon approval schema');

    const schemaDefinition = 'string projectId,bool approved,string reviewerAddress,string comments,uint256 reviewTime';

    const result = await this.attestationService.createSchema({
      network: this.config.network,
      schema: schemaDefinition,
      revocable: true
    });

    devLog.workflow('Approval schema created', {
      uid: result.uid,
      txHash: result.txHash
    });

    return result.uid;
  }

  async attestProjectSubmission(project: HackathonProject): Promise<string> {
    devLog.workflow('Attesting project submission', {
      projectId: project.id,
      submitter: project.submitter
    });

    // Encode project data
    const { SchemaEncoder } = await import('@ethereum-attestation-service/eas-sdk');
    const encoder = new SchemaEncoder(
      'string projectName,string submitterAddress,string repositoryUrl,string description,uint256 submissionTime'
    );

    const encodedData = encoder.encodeData([
      { name: 'projectName', value: project.name, type: 'string' },
      { name: 'submitterAddress', value: project.submitter, type: 'string' },
      { name: 'repositoryUrl', value: project.repositoryUrl, type: 'string' },
      { name: 'description', value: project.description, type: 'string' },
      { name: 'submissionTime', value: Math.floor(Date.now() / 1000), type: 'uint256' }
    ]);

    const result = await this.attestationService.issueAttestation({
      network: this.config.network,
      recipient: project.submitter,
      schema: this.config.projectSchema,
      data: encodedData,
      revocable: false
    });

    devLog.workflow('Project submission attested', {
      uid: result.uid,
      txHash: result.txHash
    });

    return result.uid;
  }

  async attestProjectApproval(project: HackathonProject, projectAttestationUID: string): Promise<string> {
    devLog.workflow('Attesting project approval', {
      projectId: project.id,
      approved: project.approved,
      reviewer: project.reviewedBy
    });

    const { SchemaEncoder } = await import('@ethereum-attestation-service/eas-sdk');
    const encoder = new SchemaEncoder(
      'string projectId,bool approved,string reviewerAddress,string comments,uint256 reviewTime'
    );

    const encodedData = encoder.encodeData([
      { name: 'projectId', value: project.id, type: 'string' },
      { name: 'approved', value: project.approved, type: 'bool' },
      { name: 'reviewerAddress', value: project.reviewedBy, type: 'string' },
      { name: 'comments', value: project.approved ? 'Project approved for hackathon' : 'Project needs revision', type: 'string' },
      { name: 'reviewTime', value: Math.floor(Date.now() / 1000), type: 'uint256' }
    ]);

    const result = await this.attestationService.issueAttestation({
      network: this.config.network,
      recipient: project.submitter,
      schema: this.config.approvalSchema,
      data: encodedData,
      revocable: true,
      refUID: projectAttestationUID
    });

    devLog.workflow('Project approval attested', {
      uid: result.uid,
      txHash: result.txHash,
      approved: project.approved
    });

    return result.uid;
  }

  async verifyProjectStatus(submitterAddress: string): Promise<{
    hasSubmission: boolean;
    isApproved: boolean;
    submissionUID?: string;
    approvalUID?: string;
  }> {
    devLog.workflow('Verifying project status', { submitter: submitterAddress });

    try {
      const attestations = await this.attestationService.listAttestations({
        network: this.config.network,
        recipient: submitterAddress,
        limit: 100
      });

      const submissionAttestation = attestations.find(a => a.schema === this.config.projectSchema);
      const approvalAttestation = attestations.find(a => a.schema === this.config.approvalSchema);

      return {
        hasSubmission: !!submissionAttestation,
        isApproved: !!approvalAttestation && approvalAttestation.revocationTime === 0,
        submissionUID: submissionAttestation?.uid,
        approvalUID: approvalAttestation?.uid
      };
    } catch (error) {
      devLog.error('Failed to verify project status', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        hasSubmission: false,
        isApproved: false
      };
    }
  }
}

// Example usage function
export async function runHackathonDemo() {
  try {
    devLog.workflow('Starting hackathon attestation demo');

    // Step 1: Create schemas
    const tempWorkflow = new HackathonAttestationWorkflow({
      projectSchema: '',
      approvalSchema: '',
      network: 'testnet'
    });

    const projectSchemaUID = await tempWorkflow.createProjectSubmissionSchema();
    const approvalSchemaUID = await tempWorkflow.createApprovalSchema();

    // Step 2: Initialize workflow with actual schema UIDs
    const workflow = new HackathonAttestationWorkflow({
      projectSchema: projectSchemaUID,
      approvalSchema: approvalSchemaUID,
      network: 'testnet'
    });

    // Step 3: Simulate project submission
    const project: HackathonProject = {
      id: 'hack2025-001',
      name: 'DeFi Yield Optimizer',
      submitter: '0x1234567890123456789012345678901234567890',
      repositoryUrl: 'https://github.com/submitter/defi-yield-optimizer',
      description: 'An automated yield optimization protocol for RSK DeFi',
      approved: true,
      reviewedBy: '0x0987654321098765432109876543210987654321'
    };

    // Step 4: Attest project submission
    const submissionUID = await workflow.attestProjectSubmission(project);

    // Step 5: Attest approval (could be triggered by GitHub webhook)
    const approvalUID = await workflow.attestProjectApproval(project, submissionUID);

    devLog.workflow('Hackathon demo completed successfully', {
      projectSchemaUID,
      approvalSchemaUID,
      submissionUID,
      approvalUID
    });

    return {
      projectSchemaUID,
      approvalSchemaUID,
      submissionUID,
      approvalUID
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    devLog.error('Hackathon demo failed', { error: errorMessage });
    throw error;
  }
}

// GitHub Actions webhook handler example
export function createGitHubWebhookHandler() {
  return async (webhookPayload: any) => {
    try {
      devLog.workflow('GitHub webhook received', {
        action: webhookPayload.action,
        repository: webhookPayload.repository?.name
      });

      // Check if this is a pull request approval or repository approval
      if (webhookPayload.action === 'closed' && webhookPayload.pull_request?.merged) {
        devLog.workflow('PR merged - triggering attestation workflow');

        // Extract project info from PR
        const project: HackathonProject = {
          id: `pr-${webhookPayload.pull_request.id}`,
          name: webhookPayload.repository.name,
          submitter: webhookPayload.pull_request.user.login,
          repositoryUrl: webhookPayload.repository.html_url,
          description: webhookPayload.pull_request.title,
          approved: true,
          reviewedBy: webhookPayload.pull_request.merged_by?.login || 'automated'
        };

        // Trigger attestation workflow
        const workflow = new HackathonAttestationWorkflow({
          projectSchema: process.env.PROJECT_SCHEMA_UID || '',
          approvalSchema: process.env.APPROVAL_SCHEMA_UID || '',
          network: 'testnet'
        });

        const submissionUID = await workflow.attestProjectSubmission(project);
        const approvalUID = await workflow.attestProjectApproval(project, submissionUID);

        devLog.workflow('Automated attestation completed', {
          submissionUID,
          approvalUID
        });

        return { success: true, submissionUID, approvalUID };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      devLog.error('Webhook handler failed', { error: errorMessage });
      throw error;
    }
  };
}
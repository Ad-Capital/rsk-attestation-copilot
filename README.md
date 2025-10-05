- RSK Attestation Copilot

Rootstock-powered trust automation for developers.  

Attestation Copilot plugs Rootstock attestations directly into real workflows; from hackathons to CI/CD pipelines.  
Issue, verify, and query attestations through the MCP CLI or trigger them automatically when key events happen.

__

- Why it exists
Trust shouldn’t be an afterthought.  
This tool makes attestations part of the build process; letting you verify people, projects, and actions on-chain without leaving your dev flow.

__

- Features
- On-chain attestations via Rootstock Attestation Service (RAS)
- MCP integration – new agent for `rsk-mcp-server`
- CLI commands: `issue`, `verify`, `list`
- Automation-ready – works with GitHub Actions, webhooks, or CI triggers
- Example flow: auto-issue an attestation when a project is approved

---

- Quick Start
```bash

clone and setup
git clone https://github.com/Ad-Capital/rsk-attestation-copilot
cd rsk-attestation-copilot
npm install

# link it with MCP server
npm run link:mcp

# issue an attestation
mcp attest issue --to 0x1234... --data "hackathon_approved"

# verify it
mcp attest verify --id <attestationId>

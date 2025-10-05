import { runServer } from './server.js';
import { devLog } from './utils/devLog.js';

async function main() {
  try {
    devLog.agent('RSK Attestation Copilot starting up');
    await runServer();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    devLog.error('Fatal error during startup', { error: errorMessage });
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    devLog.error('Unhandled error in main', { error: errorMessage });
    process.exit(1);
  });
}
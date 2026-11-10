import { startService } from './start';

startService().catch((err) => {
  console.error('Failed to start adsp-sdk-mcp-service:', err);
  process.exit(1);
});

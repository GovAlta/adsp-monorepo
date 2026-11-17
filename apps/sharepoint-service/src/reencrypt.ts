import { createLogger } from '@core-services/core-common';
import { disconnect } from 'mongoose';
import { environment } from './environments/environment';
import { connectMongo } from './mongo';
import { CredentialStore, parseEncryptionKeyring } from './sharepoint/credentials';

// One-off job run after a CREDENTIALS_KEY rotation; see the README. Logs counts only, never secrets.
const logger = createLogger('sharepoint-service-reencrypt', environment.LOG_LEVEL);

const run = async (): Promise<number> => {
  const keys = parseEncryptionKeyring(environment);
  if (!keys.previous) {
    logger.warn('CREDENTIALS_KEY_PREVIOUS is not set, so secrets on an older key version cannot be converted.');
  }

  const { credentialRepository } = await connectMongo({ ...environment, logger });
  try {
    const { checked, converted, changedDuringRun, failed } = await new CredentialStore(
      credentialRepository,
      keys,
    ).reencrypt();
    logger.info(
      `Re-encryption to key version ${keys.current.version} finished: ${checked} on an older version, ` +
        `${converted} converted, ${changedDuringRun} saved again during the run, ${failed} failed.`,
    );
    return failed > 0 ? 1 : 0;
  } finally {
    await disconnect();
  }
};

run()
  .then((code) => process.exit(code))
  .catch((err) => {
    logger.error(`Re-encryption failed: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });

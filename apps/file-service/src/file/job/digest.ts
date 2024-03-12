import { AdspId, User } from '@abgov/adsp-service-sdk';
import * as hasha from 'hasha';
import { Logger } from 'winston';
import { File, ServiceUserRoles } from '../types';
import { FileRepository } from '../repository';

interface DigestJobProps {
  logger: Logger;
  fileRepository: FileRepository;
}

const user = { id: 'file-digest-job', isCore: true, roles: [ServiceUserRoles.Admin] } as User;
export function createDigestJob({ logger, fileRepository }: DigestJobProps) {
  return async (tenantId: AdspId, file: File, done: (err?: Error) => void) => {
    const { id, filename } = file;
    try {
      logger.debug(`Computing digest for file ${filename} (ID: ${id})...`, {
        context: 'FileDigestJob',
        tenant: tenantId?.toString(),
      });
      const entity = await fileRepository.get(id);
      if (entity && !entity.deleted && !entity.digest) {
        const stream = await entity.readFile(user);
        const digest = await hasha.fromStream(stream, { algorithm: 'sha256', encoding: 'base64' });

        // Prefix the alg to the digest (like SRI format) so that's easier to figure out in the future.
        await entity.updateDigest(`sha256-${digest}`);

        logger.info(`Computed digest for file ${filename} (ID: ${id}).`, {
          context: 'FileDigestJob',
          tenant: tenantId?.toString(),
        });
      }

      done();
    } catch (err) {
      logger.warn(`Error encountered computing digest for file ${filename} (ID: ${id}). ${err}`, {
        context: 'FileDigestJob',
        tenant: tenantId?.toString(),
      });
      done(err);
    }
  };
}

import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import * as hasha from 'hasha';
import { Readable } from 'stream';
import { Logger } from 'winston';

import { FileEntity, FileStorageProvider } from '../file';

interface AzureBlobStorageProviderProps {
  BLOB_ACCOUNT_NAME: string;
  BLOB_ACCOUNT_KEY: string;
  BLOB_ACCOUNT_URL: string;
}

const BUFFER_SIZE = 4 * 1024 * 1024;
const MAX_BUFFERS = 20;
const TENANT_RESOURCE_PARENT = '/tenants/';

export class AzureBlobStorageProvider implements FileStorageProvider {
  private blobServiceClient: BlobServiceClient;

  constructor(
    private logger: Logger,
    { BLOB_ACCOUNT_URL, BLOB_ACCOUNT_NAME, BLOB_ACCOUNT_KEY }: AzureBlobStorageProviderProps
  ) {
    const credential = new StorageSharedKeyCredential(BLOB_ACCOUNT_NAME, BLOB_ACCOUNT_KEY);
    this.blobServiceClient = new BlobServiceClient(BLOB_ACCOUNT_URL, credential);
  }

  private createReadable(entity: FileEntity, stream: NodeJS.ReadableStream) {
    stream.on('closed', () => {
      this.logger.debug(`Reading file ${entity.filename} (ID: ${entity.id}) blob ${entity.id} stream: stream closed.`, {
        tenant: entity.tenantId?.toString(),
        context: 'AzureBlobStorageProvider',
      });
    });
    stream.on('error', (err) => {
      this.logger.error(`Error in read file ${entity.filename} (ID: ${entity.id}) blob ${entity.id} stream. ${err}`, {
        tenant: entity.tenantId?.toString(),
        context: 'AzureBlobStorageProvider',
      });
    });
    return stream as Readable;
  }

  async readFile(entity: FileEntity): Promise<Readable> {
    try {
      const containerClient = await this.getContainerClient(entity);
      const blobClient = containerClient.getBlockBlobClient(entity.id);
      const result = await blobClient.download(0, entity.size);
      return this.createReadable(entity, result.readableStreamBody);
    } catch (err) {
      this.logger.error(`Error in read file ${entity.filename} (ID: ${entity.id}) blob ${entity.id}. ${err}`, {
        tenant: entity.tenantId?.toString(),
        context: 'AzureBlobStorageProvider',
      });
      throw err;
    }
  }

  async saveFile(entity: FileEntity, content: Readable): Promise<boolean> {
    try {
      const containerClient = await this.getContainerClient(entity);
      const blobClient = containerClient.getBlockBlobClient(entity.id);

      const tags: Record<string, string> = {
        tenant: entity.tenantId.resource,
        fileId: entity.id,
        typeId: entity.type.id,
        filename: hasha(entity.filename, { algorithm: 'sha1', encoding: 'base64' }),
        createdById: entity.createdBy.id,
        securityClassification: entity.securityClassification,
      };

      if (entity.recordId) {
        tags.recordId = hasha(entity.recordId, { algorithm: 'sha1', encoding: 'base64' });
      }

      const blobOptions = { blobHTTPHeaders: { blobContentType: entity.mimeType }, tags };

      const { requestId } = await blobClient.uploadStream(content, BUFFER_SIZE, MAX_BUFFERS, blobOptions);

      const properties = await blobClient.getProperties();
      await entity.setSize(properties.contentLength);

      this.logger.debug(
        `Uploaded file ${entity.filename} (ID: ${entity.id}) as blob ${entity.id} with requestId: ${requestId}`,
        {
          tenant: entity.tenantId?.toString(),
          context: 'AzureBlobStorageProvider',
        }
      );

      return true;
    } catch (err) {
      this.logger.error(`Error in file upload ${entity.filename} (ID: ${entity.id}) as blob ${entity.id}. ${err}`, {
        tenant: entity.tenantId?.toString(),
        context: 'AzureBlobStorageProvider',
      });
      return false;
    }
  }

  async copyFile(entity: FileEntity, destination: FileEntity): Promise<boolean> {
    try {
      const containerClient = await this.getContainerClient(entity);
      const blobClient = containerClient.getBlockBlobClient(entity.id);
      const destinationBlobClient = containerClient.getBlockBlobClient(destination.id);

      const progress = await destinationBlobClient.beginCopyFromURL(blobClient.url);
      const { copyStatus } = await progress.pollUntilDone();

      if (copyStatus === 'success') {
        // Copying the blob doesn't copy tags, so we need to set that afterwards.
        const tags: Record<string, string> = {
          tenant: destination.tenantId.resource,
          fileId: destination.id,
          typeId: destination.type.id,
          filename: hasha(destination.filename, { algorithm: 'sha1', encoding: 'base64' }),
          createdById: destination.createdBy.id,
          securityClassification: destination.securityClassification,
        };

        if (entity.recordId) {
          tags.recordId = hasha(entity.recordId, { algorithm: 'sha1', encoding: 'base64' });
        }
        await destinationBlobClient.setTags(tags);

        const properties = await blobClient.getProperties();
        await destination.setSize(properties.contentLength);
      }

      return copyStatus === 'success';
    } catch (err) {
      this.logger.error(
        `Error in file copy ${entity.filename} (ID: ${entity.id}) to ${destination.filename} (ID: ${destination.id}). ${err}`,
        {
          tenant: entity.tenantId?.toString(),
          context: 'AzureBlobStorageProvider',
        }
      );
      return false;
    }
  }

  async deleteFile(entity: FileEntity): Promise<boolean> {
    try {
      const containerClient = await this.getContainerClient(entity);
      const blobClient = containerClient.getBlockBlobClient(entity.id);
      await blobClient.deleteIfExists();

      return true;
    } catch (err) {
      this.logger.error(`Error in delete file ${entity.filename} (ID: ${entity.id}) blob ${entity.id}. ${err}`, {
        tenant: entity.tenantId?.toString(),
        context: 'AzureBlobStorageProvider',
      });
      return false;
    }
  }

  private async getContainerClient(entity: FileEntity): Promise<ContainerClient> {
    const container = entity.tenantId.resource.substring(TENANT_RESOURCE_PARENT.length);
    const containerClient = this.blobServiceClient.getContainerClient(container);
    await containerClient.createIfNotExists();

    return containerClient;
  }
}

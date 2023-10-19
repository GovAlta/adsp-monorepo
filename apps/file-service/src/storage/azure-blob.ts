import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import * as hasha from 'hasha';
import { Readable } from 'stream';
import { Logger } from 'winston';

import * as detect from 'detect-file-type';

import { FileEntity, FileStorageProvider, FileTypeEntity } from '../file';

interface AzureBlobStorageProviderProps {
  BLOB_ACCOUNT_NAME: string;
  BLOB_ACCOUNT_KEY: string;
  BLOB_ACCOUNT_URL: string;
}

const BUFFER_SIZE = 4 * 1024 * 1024;
const MAX_BUFFERS = 20;

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

  async saveFile(entity: FileEntity, entityFileType: FileTypeEntity, content: Readable): Promise<boolean> {
    try {
      const containerClient = await this.getContainerClient(entity);
      const blobClient = containerClient.getBlockBlobClient(entity.id);
      let securityClassification = '';

      if (entity?.typeId && entityFileType.securityClassification !== undefined) {
        securityClassification = entityFileType.securityClassification;
      }

      const tags: Record<string, string> = {
        tenant: entity.tenantId.resource,
        fileId: entity.id,
        typeId: entity.type.id,
        filename: hasha(entity.filename, { algorithm: 'sha1', encoding: 'base64' }),
        createdById: entity.createdBy.id,
        securityClassification: securityClassification,
      };

      if (entity.recordId) {
        tags.recordId = hasha(entity.recordId, { algorithm: 'sha1', encoding: 'base64' });
      }

      const start = Date.now();

      const response = (await createCustomConcatStream(content)) as any;

      const fullStream = response.fileStream;
      const fileType = response.fileType;

      this.logger.debug(`File type: ${JSON.stringify(fileType)}`);

      const end = Date.now();

      console.log('End:' + end);
      console.log('Diff:' + (end - start));

      console.log('content length of fullStream: ' + fullStream.readableLength);

      const { requestId } = await blobClient.uploadStream(fullStream, BUFFER_SIZE, MAX_BUFFERS, { tags });

      console.log('requestId:' + requestId);

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
    const container = entity.tenantId.resource.substring(9);
    const containerClient = this.blobServiceClient.getContainerClient(container);
    await containerClient.createIfNotExists();

    return containerClient;
  }
}

function createCustomConcatStream(readableStream) {
  return new Promise((resolve, reject) => {
    const customStream = new Readable({
      read() {},
    });

    let fileType;

    readableStream.on('data', (data) => {
      if (customStream.readableLength === 0) {
        let accumulatedData = Buffer.alloc(0); // Start with an empty buffer
        accumulatedData = Buffer.concat([accumulatedData, data]);

        detect.fromBuffer(accumulatedData, (err, result) => {
          if (err) {
            console.log('err below');
            return console.log(err);
          }
          console.log('Extension: ' + JSON.stringify(result)); // { ext: 'jpg', mime: 'image/jpeg' }
          fileType = result;
        });
      }

      customStream.push(data);
    });

    // Resolve the promise when the concatStream operation is complete
    readableStream.on('end', () => {
      customStream.push(null); // Signal the end of the readable stream
      resolve({ fileStream: customStream, fileType: fileType });
    });

    // Handle any errors
    readableStream.on('error', (err) => {
      reject(err);
    });
  });
}

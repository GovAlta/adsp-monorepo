import * as detect from 'detect-file-type';
import { Readable } from 'stream';
import { Logger } from 'winston';

interface CustomConcatStream {
  fileStream: Readable;
  fileType: { mime: string };
}

export class FileTypeDetector {
  private content: Readable;
  private logger: Logger;

  constructor(logger: Logger, content: Readable) {
    this.content = content;
    this.logger = logger;
  }

  async detect() {
    const start = Date.now();
    const response = (await this.createCustomConcatStream(this.content)) as CustomConcatStream;

    const fullStream = response.fileStream;
    const fileType = response.fileType;

    const end = Date.now();

    this.logger.debug('Size of file to be uploaded: ' + fullStream?.readableLength / 1000 + 'kb');
    this.logger.debug('File type as determined: ' + fileType?.mime);
    this.logger.debug('Time to determine file type: ' + (end - start) / 1000 + 's');

    return response;
  }

  private createCustomConcatStream(readableStream) {
    return new Promise((resolve, reject) => {
      const customStream = new Readable({
        //eslint-disable-next-line
        read() {},
      });

      let fileType;

      readableStream.on('data', (data) => {
        if (customStream.readableLength === 0) {
          let accumulatedData = Buffer.alloc(0); // Start with an empty buffer
          accumulatedData = Buffer.concat([accumulatedData, data]);

          detect.fromBuffer(accumulatedData, (err, result) => {
            if (err) {
              console.error(err);
              reject(err);
            }

            fileType = result;
          });
        }

        customStream.push(data);
      });

      // Resolve the promise when the concatStream operation is complete
      readableStream.on('end', () => {
        customStream.push(null); // Signal the end of the readable stream
        const response: CustomConcatStream = { fileStream: customStream, fileType: fileType };
        resolve(response);
      });

      // Handle any errors
      readableStream.on('error', (err) => {
        reject(err);
      });
    });
  }
}

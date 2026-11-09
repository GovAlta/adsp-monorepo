import { fileTypeFromBuffer } from 'file-type';
import { extname } from 'path';
import { Readable } from 'stream';
import { Logger } from 'winston';

interface CustomConcatStream {
  fileStream: Readable;
  fileType: { mime: string; ext: string };
}

// Text file types doesnt have magic numbers so we to analuze if it has text in it.
// Deliberately excludes html and svg, which must not be served back as renderable content.
const TEXT_MIME_TYPES: Record<string, string> = {
  txt: 'text/plain',
  log: 'text/plain',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  json: 'application/json',
  xml: 'application/xml',
  md: 'text/markdown',
};

const TEXT_SAMPLE_SIZE = 8192;

const isText = (buffer: Buffer): boolean => {
  if (!buffer.length) {
    return false;
  }

  const sample = buffer.subarray(0, TEXT_SAMPLE_SIZE);
  if (sample.includes(0)) {
    return false;
  }

  try {
    // stream: true tolerates a multi-byte character split by the sample boundary.
    new TextDecoder('utf-8', { fatal: true }).decode(sample, { stream: true });
    return true;
  } catch {
    return false;
  }
};

export class FileTypeDetector {
  private content: Readable;
  private logger: Logger;
  private filename?: string;

  constructor(logger: Logger, content: Readable, filename?: string) {
    this.content = content;
    this.logger = logger;
    this.filename = filename;
  }

  private detectText(buffer: Buffer): { mime: string; ext: string } | undefined {
    const ext = extname(this.filename ?? '')
      .slice(1)
      .toLowerCase();
    const mime = TEXT_MIME_TYPES[ext];

    return mime && isText(buffer) ? { mime, ext } : undefined;
  }

  async detect() {
    const start = Date.now();

    const response = (await this.createCustomConcatStream(this.content)) as CustomConcatStream;
    const fileType = response.fileType;

    const end = Date.now();

    this.logger.debug('File type as determined: ' + fileType?.mime);
    this.logger.debug('Time to determine file type: ' + (end - start) / 1000 + 's');

    return response;
  }

  private createCustomConcatStream(readableStream) {
    return new Promise((resolve, reject) => {
      const customStream = new Readable({
        read() {},
      });

      const chunks: Buffer[] = [];

      const onData = (data) => {
        chunks.push(data);
        customStream.push(data);
      };

      readableStream.on('data', onData);

      // Resolve the promise when the concatStream operation is complete
      readableStream.on('end', async () => {
        customStream.push(null); // Signal the end of the readable stream
        readableStream.removeListener('data', onData);

        try {
          // Archive-based formats (docx, xlsx, ...) need entries beyond the first chunk to be identified.
          const buffer = Buffer.concat(chunks);
          const fileType = (await fileTypeFromBuffer(buffer)) ?? this.detectText(buffer);
          resolve({ fileStream: customStream, fileType } as CustomConcatStream);
        } catch (err) {
          reject(err);
        }
      });

      // Handle any errors
      readableStream.on('error', (err) => {
        reject(err);
      });
    });
  }
}

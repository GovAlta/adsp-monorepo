import { FilePart } from '@ai-sdk/provider-utils-v5';
import * as mammoth from 'mammoth';
import type { Logger } from 'winston';

export function isWordDocument(mediaType?: string, filename?: string): boolean {
  const normalizedType = mediaType?.toLowerCase() || '';
  const normalizedName = filename?.toLowerCase() || '';

  return (
    normalizedType === 'application/msword' ||
    normalizedType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    normalizedName.endsWith('.doc') ||
    normalizedName.endsWith('.docx')
  );
}

export async function transferWordDocumentToTextFile(
  logger: Logger,
  sourceDataUrl: string,
  sourceFilename?: string,
): Promise<FilePart | undefined> {
  const encoded = sourceDataUrl.split(',', 2)[1];
  if (!encoded) {
    return undefined;
  }

  try {
    const binary = Buffer.from(encoded, 'base64');
    const { value } = await mammoth.extractRawText({ buffer: binary });
    const text = (value || '').trim();
    if (!text) {
      return undefined;
    }

    const outputName = sourceFilename ? sourceFilename.replace(/\.(docx?|DOCX?)$/, '.txt') : 'document.txt';
    const textDataUrl = `data:text/plain;base64,${Buffer.from(text, 'utf8').toString('base64')}`;

    return {
      type: 'file',
      data: textDataUrl,
      mediaType: 'text/plain',
      filename: outputName,
    };
  } catch (err) {
    logger.warn(
      `Unable to convert Word document '${sourceFilename || 'document'}' to text; proceeding with original file payload.`,
      {
        context: 'file-service-download-processor',
        error: err instanceof Error ? err.message : String(err),
      },
    );
    return undefined;
  }
}

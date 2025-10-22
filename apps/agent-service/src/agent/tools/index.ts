import { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { createFormConfigurationTools } from './formConfiguration';
import { createSchemaTools } from './schema';
import { createFileTools } from './file';

interface ToolsProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export async function createTools({ logger, directory, tokenProvider }: ToolsProps) {
  const { formConfigurationRetrievalTool, formConfigurationUpdateTool } = await createFormConfigurationTools({
    logger,
    directory,
    tokenProvider,
  });

  const { schemaDefinitionTool } = await createSchemaTools();

  const { fileDownloadTool } = await createFileTools({ logger, directory, tokenProvider });

  return { schemaDefinitionTool, formConfigurationRetrievalTool, formConfigurationUpdateTool, fileDownloadTool };
}

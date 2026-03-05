import { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { createFormConfigurationTools } from './formConfiguration';
import { createSchemaTools } from './schema';
import { createFileTools } from './file';
import { createRendererCatalogTools } from './rendererCatalog';

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
  const { rendererCatalogTool } = await createRendererCatalogTools({ logger });

  return {
    schemaDefinitionTool,
    formConfigurationRetrievalTool,
    formConfigurationUpdateTool,
    fileDownloadTool,
    rendererCatalogTool,
  };
}

export * from './request';

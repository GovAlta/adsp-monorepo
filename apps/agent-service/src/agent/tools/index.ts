import { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { createFormConfigurationTools } from './formConfiguration';
import { createSchemaTools } from './schema';
import { createFileTools } from './file';
import { createRendererCatalogTools } from './rendererCatalog';
import { createFormTools } from './form';

interface ToolsProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export async function createTools({ logger, directory, tokenProvider }: ToolsProps) {

  const { fileDownloadTool, fileCopyTool } = await createFileTools({ logger, directory, tokenProvider });

  const { formConfigurationRetrievalTool, formConfigurationUpdateTool } = await createFormConfigurationTools({
    logger,
    directory,
    tokenProvider,
  });
  const { formDataRetrievalTool, formDataUpdateTool } = await createFormTools({ logger, directory });

  const { schemaDefinitionTool } = await createSchemaTools();
  const { rendererCatalogTool } = await createRendererCatalogTools({ logger });

  return {
    fileDownloadTool,
    fileCopyTool,
    formConfigurationRetrievalTool,
    formConfigurationUpdateTool,
    formDataRetrievalTool, 
    formDataUpdateTool,
    schemaDefinitionTool,
    rendererCatalogTool,
  };
}

export * from './request';

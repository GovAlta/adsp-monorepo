import { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { createFormConfigurationTools } from './formConfiguration';
import { createSchemaTools } from './schema';
import { createFileTools } from './file';
import { createDocumentTools } from './document';
import { createRendererCatalogTools } from './rendererCatalog';
import { createFormTools } from './form';
import { createDataRegisterTools } from './dataRegister';
import { createNotificationTemplateTools } from './notificationTemplate';
import { createNxAdspTemplateTools } from './nxAdspTemplates';
import { createSchemaIndexTools } from './schemaIndex';
import { createSchemaPatchTools } from './schemaPatch';

interface ToolsProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export async function createTools({ logger, directory, tokenProvider }: ToolsProps) {
  const { fileDownloadTool, fileCopyTool } = await createFileTools({ logger, directory, tokenProvider });
  const { documentExtractTool } = await createDocumentTools({ logger, directory, tokenProvider });

  const { formConfigurationRetrievalTool, formConfigurationUpdateTool } = await createFormConfigurationTools({
    logger,
    directory,
    tokenProvider,
  });
  const { formDataRetrievalTool, formDataUpdateTool } = await createFormTools({ logger, directory });

  const { schemaDefinitionTool } = await createSchemaTools();
  const { rendererCatalogTool } = await createRendererCatalogTools({ logger });

  const { dataRegisterListTool, dataRegisterCreateTool, dataRegisterGetTool, dataRegisterUpdateTool } =
    await createDataRegisterTools({
      logger,
      directory,
      tokenProvider,
    });

  const { emailNotificationGenerateTool } = await createNotificationTemplateTools({
    logger,
    directory,
    tokenProvider,
  });

  const { listNxAdspTemplatesTool, getNxAdspTemplateTool } = createNxAdspTemplateTools();

  const { formSchemaIndex } = await createSchemaIndexTools({ logger, directory, tokenProvider });
  const { formSchemaPatch } = await createSchemaPatchTools({ logger, directory, tokenProvider });

  return {
    fileDownloadTool,
    fileCopyTool,
    documentExtractTool,
    formConfigurationRetrievalTool,
    formConfigurationUpdateTool,
    formDataRetrievalTool,
    formDataUpdateTool,
    schemaDefinitionTool,
    rendererCatalogTool,
    dataRegisterListTool,
    dataRegisterCreateTool,
    dataRegisterGetTool,
    dataRegisterUpdateTool,
    emailNotificationGenerateTool,
    listNxAdspTemplatesTool,
    getNxAdspTemplateTool,
    formSchemaIndex,
    formSchemaPatch,
  };
}

export * from './request';

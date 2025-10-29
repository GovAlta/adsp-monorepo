import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Logger } from 'winston';
import { environment } from '../../environments/environment';
import { createFormAgents } from '../agents/form';
import { AgentBroker } from '../model';
import { createTools } from '../tools';
import { createBrokerInputProcessors, createInputProcessors } from '../processors';

export interface AgentConfiguration {
  name: string;
  instructions: string;
  userRoles: string[];
}
export type AgentConfigurations = Record<string, AgentConfiguration>;

export class AgentServiceConfiguration {
  private mastra: Mastra;
  private brokers: Record<string, AgentBroker> = {};
  constructor(
    private logger: Logger,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
    tenantId: AdspId,
    tenant: AgentConfigurations,
    core: AgentConfigurations
  ) {
    const configuration = { ...tenant, ...core };
    this.initializeBrokers(tenantId, configuration);
  }

  private async initializeBrokers(tenantId: AdspId, configuration: AgentConfigurations) {
    try {
      const { schemaDefinitionTool, formConfigurationRetrievalTool, formConfigurationUpdateTool, fileDownloadTool } =
        await createTools({
          logger: this.logger,
          directory: this.directory,
          tokenProvider: this.tokenProvider,
        });

      const { formGenerationAgent, pdfFormAnalysisAgent } = await createFormAgents({
        logger: this.logger,
        schemaDefinitionTool,
        formConfigurationRetrievalTool,
        formConfigurationUpdateTool,
        fileDownloadTool,
      });

      this.mastra = new Mastra({
        agents: {
          ...Object.entries(configuration).reduce(
            (agents, [key, configuration]) => ({
              ...agents,
              [key]: new Agent({
                name: configuration.name,
                instructions: configuration.instructions,
                model: environment.MODEL,
                tools: {},
                inputProcessors: ({ runtimeContext }) =>
                  createInputProcessors({
                    logger: this.logger,
                    runtimeContext: runtimeContext as RuntimeContext<Record<string, unknown>>,
                  }),
              }),
            }),
            {} as Record<string, Agent>
          ),
          formGenerationAgent,
          pdfFormAnalysisAgent,
        },
      });

      const inputProcessors = createBrokerInputProcessors({
        logger: this.logger,
        directory: this.directory,
        tokenProvider: this.tokenProvider,
      });
      this.brokers = Object.entries(this.mastra.getAgents()).reduce(
        (brokers, [key, agent]) => ({
          ...brokers,
          [key]: new AgentBroker(this.logger, tenantId, inputProcessors, agent, configuration[key] || {}),
        }),
        {}
      );
    } catch (err) {
      this.logger.error('Error encountered initializing agent brokers.', {
        context: 'AgentServiceConfiguration',
        tenant: tenantId?.toString(),
      });
    }
  }

  public getAgent(agent: string) {
    return this.brokers[agent];
  }

  public getAgents() {
    return Object.values(this.brokers).map((broker) => ({
      id: broker.Agent.id,
      name: broker.Agent.name,
    }));
  }
}

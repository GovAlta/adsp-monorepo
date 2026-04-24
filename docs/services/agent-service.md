---
layout: page
title: Agent service
nav_order: 21
parent: Services
---

# Agent service

Agent service provides AI-powered agents that can assist users with various tasks. The service supports configurable agents with custom instructions, tools, and role-based access control. Agents can be accessed via REST API or WebSocket for real-time streaming interactions.

## Client roles

client `urn:ads:platform:agent-service`

| name       | description                                                                                              |
| :--------- | :------------------------------------------------------------------------------------------------------- |
| agent-user | Role for users with access to agents. Included in tenant admin role.                                     |
| agent-tool | Agent tool role assigned to agent service service account. Used to grant resource access to agent tools. |

Users must have the `urn:ads:platform:agent-service:agent-user` client role to interact with agents. Additionally, agents can be configured with specific `userRoles` to restrict access to particular user roles.

## Concepts

### Agent

An agent is an AI assistant configured with specific instructions, tools, and optional access to other agents. Agents are configured in the [configuration service](configuration-service.md) under the `platform:agent-service` namespace and name.

Each agent configuration includes:

- **name**: Display name for the agent
- **description**: Optional description of the agent's purpose
- **instructions**: System prompt that defines the agent's behavior
- **outputSchema**: Optional JSON Schema object that defines the structure of the agent's response. When configured, the agent will return structured output matching this schema alongside text responses.
- **userRoles**: Optional array of roles required to use the agent
- **agents**: Optional array of other agent IDs this agent can delegate to
- **tools**: Optional array of tools available to the agent
- **mcp**: Optional MCP server configuration that adds tools from external MCP servers. You can optionally limit access with `capabilities` per server.

### Tools

Tools extend agent capabilities by allowing them to perform specific actions. The service provides built-in tools and supports custom API request tools.

Built-in tools:

- `schemaDefinitionTool`: Retrieves JSON schema definitions
- `formConfigurationRetrievalTool`: Retrieves form configurations
- `formConfigurationUpdateTool`: Updates form configurations
- `fileDownloadTool`: Downloads files from the file service

Custom API tools can be configured to call external APIs on behalf of the agent.

### Threads

Conversations with agents are organized into threads. Each thread maintains context across multiple messages, allowing for coherent multi-turn conversations. Thread IDs can be provided by the client or generated automatically.

### Structured Output

Agents can be configured with a JSON Schema that defines the structure of their output. When an agent has an `outputSchema` defined, it will return both text responses and structured JSON objects matching that schema. This is useful for extracting machine-readable data from agent responses, such as:

- Parsing form data
- Extracting entities or classifications
- Standardized API responses
- Validating response format

The agent will attempt to return data matching the schema; if schema validation fails, the agent will fall back to text-only responses with a warning in the conversation logs.

## Code examples

### Configure an agent

Agents are configured using the [configuration service](configuration-service.md). Note that new configuration may take up to 15 mins to apply.

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';

const request = {
  operation: 'UPDATE',
  update: {
    'my-assistant': {
      name: 'My Assistant',
      description: 'A helpful assistant for my application',
      instructions: 'You are a helpful assistant. Answer questions clearly and concisely.',
      userRoles: ['my-app-user'],
      tools: ['schemaDefinitionTool'],
    },
  },
};

await fetch(`${configurationServiceUrl}/configuration/v2/configuration/platform/agent-service`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

### List available agents

```typescript
const agentServiceUrl = 'https://agent-service.adsp.alberta.ca';

const response = await fetch(`${agentServiceUrl}/agent/v1/agents`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const { agents } = await response.json();
```

### Message an agent (REST API)

Send a message to an agent and receive a complete response. If the agent has a `outputSchema` configured, the response will also include a `output` field with structured data.

```typescript
const agentServiceUrl = 'https://agent-service.adsp.alberta.ca';
const agentId = 'my-assistant';

const response = await fetch(`${agentServiceUrl}/agent/v1/agents/${agentId}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: 'Hello, can you help me with a question?',
  }),
});

const { agent, content, output } = await response.json();

// content contains the text response
// output contains structured data if outputSchema was configured (null otherwise)
if (output) {
  console.log('Structured response:', output);
}
```

### Stream agent responses (WebSocket)

Connect via WebSocket for real-time streaming responses. The WebSocket endpoint uses Socket.IO and requires the tenant name as the namespace. When the response is complete, the done event will include any structured `output` if the agent has an `outputSchema` configured.

```typescript
import { io } from 'socket.io-client';

const socket = io('https://agent-service.adsp.alberta.ca/My Tenant', {
  auth: {
    token: accessToken,
  },
});

socket.on('connect', () => {
  console.log('Connected to agent service');
});

// Send a message to an agent
socket.send({
  agent: 'my-assistant',
  threadId: 'optional-thread-id',
  messageId: 'optional-message-id',
  content: 'Hello, can you help me?',
  context: {
    // Optional context data for the agent
  },
});

// Receive streaming response
socket.on('stream', (data) => {
  const { agent, threadId, messageId, replyTo, content, output, done } = data;
  if (done) {
    console.log('Response complete');
    // If the agent has a outputSchema, structured data is included here
    if (output) {
      console.log('Structured response:', output);
    }
  } else {
    // Streaming text content arrives as deltas
    process.stdout.write(content);
  }
});

// Handle errors
socket.on('error', (message) => {
  console.error('Agent error:', message);
});
```

### Configure a custom API tool

Agents can be configured with custom tools that call external APIs.

```typescript
const request = {
  operation: 'UPDATE',
  update: {
    'api-assistant': {
      name: 'API Assistant',
      instructions: 'You help users interact with external APIs.',
      tools: [
        'schemaDefinitionTool',
        {
          id: 'getWeather',
          type: 'api',
          description: 'Gets current weather for a location',
          inputSchema: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'City name' },
            },
            required: ['location'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              temperature: { type: 'number' },
              conditions: { type: 'string' },
            },
          },
          method: 'GET',
          api: 'urn:ads:platform:weather-service:v1',
          path: '/weather',
          userContext: true,
        },
      ],
    },
  },
};
```

### Configure MCP server capabilities

Agents can be configured to use tools exposed by external MCP servers.

```typescript
const request = {
  operation: 'UPDATE',
  update: {
    'mcp-assistant': {
      name: 'MCP Assistant',
      instructions: 'Use MCP tools when they help answer user requests.',
      mcp: {
        servers: [
          {
            id: 'goa-design-system',
            url: 'https://example.com/mcp',
            headers: {
              Authorization: 'Bearer <mcp-token>',
            },
            // Optional: restrict to a subset of tools from this MCP server.
            capabilities: ['getComponent', 'searchTokens'],
          },
        ],
      },
    },
  },
};
```

When loaded, MCP tools are namespaced as `<serverId>_<toolName>` to avoid naming collisions across servers.

### Configure structured output

Agents can be configured with a JSON Schema to return structured data. This is useful for extracting machine-readable information from agent responses.

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';

const request = {
  operation: 'UPDATE',
  update: {
    'data-extractor': {
      name: 'Data Extractor',
      description: 'Extracts structured data from unstructured text',
      instructions:
        'You are an expert at extracting structured information. Extract all relevant data and return it as valid JSON matching the provided schema.',
      outputSchema: {
        type: 'object',
        properties: {
          entities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string', enum: ['person', 'organization', 'location'] },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['name', 'type'],
            },
          },
          sentiment: {
            type: 'string',
            enum: ['positive', 'neutral', 'negative'],
          },
          summary: { type: 'string' },
        },
        required: ['entities', 'sentiment'],
      },
      tools: ['schemaDefinitionTool'],
    },
  },
};

await fetch(`${configurationServiceUrl}/configuration/v2/configuration/platform/agent-service`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

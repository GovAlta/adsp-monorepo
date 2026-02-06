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

| name | description |
|:-|:-|
| agent-user | Role for users with access to agents. Included in tenant admin role. |
| agent-tool | Agent tool role assigned to agent service service account. Used to grant resource access to agent tools. |

Users must have the `urn:ads:platform:agent-service:agent-user` client role to interact with agents. Additionally, agents can be configured with specific `userRoles` to restrict access to particular user roles.

## Concepts
### Agent
An agent is an AI assistant configured with specific instructions, tools, and optional access to other agents. Agents are configured in the [configuration service](configuration-service.md) under the `platform:agent-service` namespace and name.

Each agent configuration includes:
- **name**: Display name for the agent
- **description**: Optional description of the agent's purpose
- **instructions**: System prompt that defines the agent's behavior
- **userRoles**: Optional array of roles required to use the agent
- **agents**: Optional array of other agent IDs this agent can delegate to
- **tools**: Optional array of tools available to the agent

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
        tools: ['schemaDefinitionTool']
      }
    }
  }

  await fetch(
    `${configurationServiceUrl}/configuration/v2/configuration/platform/agent-service`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
    }
  );
```

### List available agents
```typescript
  const agentServiceUrl = 'https://agent-service.adsp.alberta.ca';

  const response = await fetch(
    `${agentServiceUrl}/agent/v1/agents`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  );

  const { agents } = await response.json();
```

### Message an agent (REST API)
Send a message to an agent and receive a complete response.

```typescript
  const agentServiceUrl = 'https://agent-service.adsp.alberta.ca';
  const agentId = 'my-assistant';

  const response = await fetch(
    `${agentServiceUrl}/agent/v1/agents/${agentId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Hello, can you help me with a question?'
      }),
    }
  );

  const { agent, content } = await response.json();
```

### Stream agent responses (WebSocket)
Connect via WebSocket for real-time streaming responses. The WebSocket endpoint uses Socket.IO and requires the tenant name as the namespace.

```typescript
  import { io } from 'socket.io-client';

  const socket = io('https://agent-service.adsp.alberta.ca/My Tenant', {
    auth: {
      token: accessToken
    }
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
    }
  });

  // Receive streaming response
  socket.on('stream', (data) => {
    const { agent, threadId, messageId, replyTo, content, done } = data;
    if (done) {
      console.log('Response complete');
    } else {
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
                location: { type: 'string', description: 'City name' }
              },
              required: ['location']
            },
            outputSchema: {
              type: 'object',
              properties: {
                temperature: { type: 'number' },
                conditions: { type: 'string' }
              }
            },
            method: 'GET',
            api: 'urn:ads:platform:weather-service:v1',
            path: '/weather',
            userContext: true
          }
        ]
      }
    }
  }
```

---
layout: page
title: Agent service
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

Access to agents is checked in two places:

- **socket.io connections** require the `urn:ads:platform:agent-service:agent-user` role in the tenant. Connections without it are disconnected.
- **Each agent** can be configured with `userRoles`. When it has any, the user needs at least one of them in the tenant to message the agent or delete its threads, over REST or socket.io. Agents without `userRoles` are open to any authenticated user of the REST API.

The REST API itself only requires an authenticated user: listing agents, reading an agent, and `GET /access/scope` need no role, and the REST message and thread endpoints check only the agent's `userRoles`.

The service also registers the `agent-attachments` file type for files users attach to messages. Users with `agent-user` can upload them, and only the agent service account (`agent-tool`) can read them. They are deleted after 7 days.

## Tenancy

Agents, threads, and workspaces are scoped to a tenant.

- **Tenant users and service accounts** always act on the tenant of their token. Any `tenantId` query parameter, and the socket.io namespace, are ignored.
- **Core (platform) users** act on the tenant in the `tenantId` query parameter (for example, `?tenantId=urn:ads:platform:tenant-service:v2:/tenants/{id}`). Without it they only see the platform agents. A `tenantId` that is not an ADSP ID responds `400`. Core users have no tenant roles, so they can only use agents without `userRoles`, and they can't connect over socket.io.
- **Platform and tenant agents** are combined. The platform provides core agents (for example, `formGenerationAgent`) to every tenant, and tenants add their own in their `platform:agent-service` configuration. A platform agent replaces a tenant agent with the same ID, so give tenant agents distinct IDs.
- **Threads** belong to the user and tenant that created them. Deleting another user's thread, or a thread from another tenant, responds `{ "deleted": false }` rather than an error, so callers can't tell whether it exists.

## API overview

REST endpoints are under `https://agent-service.adsp.alberta.ca/agent/v1` and require a bearer token. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Area         | Endpoints                                     | Required role                                                             |
| :----------- | :-------------------------------------------- | :------------------------------------------------------------------------ |
| Access scope | `GET /access/scope`                           | Any authenticated user                                                    |
| Agents       | `GET /agents`, `GET /agents/{agentId}`        | Any authenticated user                                                    |
| Messages     | `POST /agents/{agentId}`                      | Any authenticated user, or one of the agent's `userRoles` when it has any |
| Threads      | `DELETE /agents/{agentId}/threads/{threadId}` | Any authenticated user, or one of the agent's `userRoles` when it has any |

`POST /agents/{agentId}` responds with the complete reply and starts a new thread for every request. Streaming replies, multi-turn conversations, and workspaces are only available over [socket.io](#socketio-interface). socket.io isn't a REST transport, so it isn't in the API documentation; its events are described below.

Agents are configured through the [configuration service](configuration-service.md); there are no agent-service endpoints for changing them.

## Concepts

### Agent

An agent is an AI assistant configured with specific instructions, tools, and optional access to other agents. Agents are configured in the [configuration service](configuration-service.md) under the `platform:agent-service` namespace and name. The service reloads agents when their configuration changes.

Each agent configuration includes:

- **name**: Display name for the agent
- **description**: Optional description of the agent's purpose
- **instructions**: System prompt that defines the agent's behavior
- **outputSchema**: Optional JSON Schema object that defines the structure of the agent's response. When configured, the agent will return structured output matching this schema alongside text responses.
- **userRoles**: Optional array of roles required to use the agent
- **agents**: Optional array of other agent IDs this agent can delegate to
- **tools**: Optional array of tools available to the agent
- **mcp**: Optional MCP server configuration that adds tools from external MCP servers. You can optionally limit access with `capabilities` per server.
- **maxSteps**: Optional maximum number of steps (model calls, including tool calls) in one reply.
- **timeoutMs**: Optional time limit for one request, in milliseconds.

### Tools

Tools extend agent capabilities by allowing them to perform specific actions. The service provides built-in tools and supports custom API request tools.

Built-in tools include:

- `schemaDefinitionTool`: Retrieves JSON schema definitions
- `formConfigurationRetrievalTool` and `formConfigurationUpdateTool`: Retrieve and update form configurations
- `pdfConfigurationRetrievalTool` and `pdfConfigurationUpdateTool`: Retrieve and update PDF templates
- `formDataRetrievalTool` and `formDataUpdateTool`: Retrieve and update form data
- `fileDownloadTool`, `fileCopyTool`, and `documentExtractTool`: Download, copy, and extract text from files in the file service
- `dataRegisterListTool`, `dataRegisterGetTool`, `dataRegisterCreateTool`, and `dataRegisterUpdateTool`: Manage data registers
- `emailNotificationGenerateTool`: Generates notification email templates
- `searchAdspDocsTool`, `readAdspDocTool`, and `searchAdspSdkReferenceTool`: Search the ADSP documentation and SDK reference

Custom API tools can be configured to call external APIs on behalf of the agent.

### Threads

Conversations with agents are organized into threads. Each thread maintains context across multiple messages, allowing for coherent multi-turn conversations. Thread IDs can be provided by the client or generated automatically.

A thread's context belongs only to that thread, so a client can start a fresh conversation by sending messages with a new thread ID. Threads expire after a period of inactivity (`AGENT_THREAD_TTL_MINUTES`, 30 minutes by default) and are then deleted; a user can also delete one of their own threads right away (see [Delete a thread](#delete-a-thread)).

Threads only carry context across messages sent over socket.io. Each REST `POST /agents/{agentId}` request uses a new thread.

### Workspaces

Some agents, such as the builder agents, work on files in a workspace that belongs to the thread. A client initializes the workspace from a file service tarball, can read and update its files, and receives `workspace-change` events when the agent changes them. Workspaces are deleted with their thread.

### Structured Output

Agents can be configured with a JSON Schema that defines the structure of their output. When an agent has an `outputSchema` defined, it will return both text responses and structured JSON objects matching that schema. This is useful for extracting machine-readable data from agent responses, such as:

- Parsing form data
- Extracting entities or classifications
- Standardized API responses
- Validating response format

The agent will attempt to return data matching the schema; if schema validation fails, the agent will fall back to text-only responses with a warning in the conversation logs.

### socket.io interface

Clients connect with [socket.io](https://socket.io) to stream replies and hold multi-turn conversations.

- **Connect** to `https://agent-service.adsp.alberta.ca/<tenant name>` (or the default namespace `/`) with the access token in `auth.token`. The user needs the `agent-user` role in the tenant. The tenant of a tenant user's token is used whatever the namespace.
- **Wait for ready**: once agent configuration is loaded, the service sends a `message` event (`Connected as user ... for tenant ...`). Send messages after it arrives.
- **Token expiry**: shortly before the token expires the service sends `session-expired` (`{ code: 'USER_TOKEN_EXPIRED' }`) and disconnects, after any reply in progress is sent. Reconnect with a new token.
- **Errors** in handling an event, such as an unknown agent or invalid payload, are sent as an `error` event with a message string.

Events the client sends:

| Event              | Payload                                                                                                                              | Service responds with                                                |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| `message`          | `{ agent, threadId?, messageId?, content, context?, rawChunks? }`. `content` is a string or an array of text, image, and file parts. | `stream` events, then `conversation-status`                          |
| `workspace-init`   | `{ agent, threadId?, workspaceTarball }`. `workspaceTarball` is the file service URN of a `.tar.gz` file.                            | `workspace-ready` with `revision` and `updatedAt`                    |
| `workspace-read`   | `{ agent, threadId? }`                                                                                                               | `workspace-state` with `revision`, `updatedAt`, and `files`          |
| `workspace-update` | `{ agent, threadId?, writes?: [{ path, content }], deletes?: [path] }`                                                               | `workspace-updated` with `revision`, `writeCount`, and `deleteCount` |

A missing `threadId` or `messageId` is generated. `stream` events carry `agent`, `threadId`, `messageId` (of the reply), and `replyTo` (the message ID). By default each carries a text `content` delta. With `rawChunks: true`, each instead carries a `chunk` of `{ type, payload }`, including `tool-call`, `tool-result`, and `reasoning-delta` chunks, and the service also sends `workspace-change` events. In both modes the service sends a `chunk` of type `heartbeat` every 15 seconds while a reply is in progress. The last `stream` event has `done: true`, with `output` and `usage`; when a reply stops early, for example at the agent's time or step limit, it has an `error` chunk with a `code` of `GENERATION_DEADLINE` or `MAX_STEPS`.

## Events

The agent service sends the following domain events under the `agent-service` namespace:

| Event                       | Description                                                      |
| :-------------------------- | :--------------------------------------------------------------- |
| `thread-created`            | A user started a conversation thread with an agent.              |
| `thread-deleted`            | A thread was deleted, because the user deleted it or it expired. |
| `workspace-created`         | A thread's workspace was created from an uploaded file.          |
| `workspace-creation-failed` | Creating a thread's workspace from an uploaded file failed.      |

The service doesn't consume domain events, but it listens for configuration service updates so that changed agent configuration applies without waiting for its cache to expire.

## Code examples

### Configure an agent

Agents are configured using the [configuration service](configuration-service.md). This requires the configuration service `configuration-admin` role.

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

// For example: { agents: [{ id: 'formGenerationAgent', name: 'Form Generation Agent' }] }
const { agents } = await response.json();
```

### Message an agent (REST API)

Send a message to an agent and receive a complete response. Each request starts a new thread, so include any earlier messages the agent needs in the request (the body can be an array of messages). If the agent has an `outputSchema` configured, the response will also include an `output` field with structured data.

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
// output contains structured data if outputSchema was configured (absent otherwise)
if (output) {
  console.log('Structured response:', output);
}
```

### Stream agent responses (WebSocket)

Connect via WebSocket for real-time streaming responses. The WebSocket endpoint uses Socket.IO, with the tenant name as the namespace, and requires the `agent-user` role (see [socket.io interface](#socketio-interface)). When the response is complete, the done event will include any structured `output` if the agent has an `outputSchema` configured.

```typescript
import { io } from 'socket.io-client';

const socket = io('https://agent-service.adsp.alberta.ca/My Tenant', {
  auth: {
    token: accessToken,
  },
});

// The service sends a message once it is ready to receive messages.
socket.once('message', () => {
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
});

// Receive streaming response
socket.on('stream', (data) => {
  const { agent, threadId, messageId, replyTo, content, chunk, output, done } = data;
  if (chunk?.type === 'heartbeat') {
    return;
  } else if (chunk?.type === 'error') {
    console.error('Reply stopped:', chunk.payload.code, chunk.payload.message);
  } else if (done) {
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

socket.on('session-expired', () => {
  // Reconnect with a fresh access token.
});
```

#### Token usage and conversation length

When the provider reports token usage, the done event also includes `usage`:

| Field                 | Meaning                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `contextTokens`       | Input tokens of the agent's last model call: how much of the context window the conversation takes up |
| `contextWindowTokens` | The model's context window, from `AGENT_MODEL_CONTEXT_TOKENS` (default 256,000)                       |
| `totalTokens`         | Every token the reply used across its model calls, including calls tools make, such as form generation |
| `outputTokens`        | Tokens the model wrote                                                                               |
| `modelCalls`          | Number of model calls the reply made                                                                 |

After each reply, a `conversation-status` event says how the conversation stands. `state` is one of:

- `ok`: nothing to tell the user.
- `notice`: memory has started keeping the conversation short, which is normal but means early details may be missed. `reason` is `summarised` (observational memory has replaced older messages with notes) or `older-messages-dropped` (an agent without observational memory now reads only its most recent `messageLimit` messages).
- `warning`: the conversation is close to what the assistant can handle well. `reason` is `near-context-limit` (it takes up at least 70% of the context window) or `notes-condensed` (observational memory has condensed its notes, which takes a very long conversation).

```typescript
socket.on('conversation-status', ({ threadId, contextTokens, contextWindowTokens, state, reason }) => {
  if (state === 'warning') {
    console.log(`Thread ${threadId} is close to the assistant's limit (${reason}); suggest starting a new chat.`);
  }
});
```

Observational memory summarises older messages at `AGENT_OM_MESSAGE_TOKENS` unobserved tokens (default 30,000) and condenses its notes at `AGENT_OM_OBSERVATION_TOKENS` (default 40,000).

### Delete a thread

Delete one of your own threads, with its stored messages, context, and workspace, for example when the user starts a new chat. The response is `{ "deleted": false }` when you have no thread with that ID, so repeating the request is harmless. The thread ID is the `threadId` used on socket.io.

```typescript
const agentServiceUrl = 'https://agent-service.adsp.alberta.ca';

const response = await fetch(`${agentServiceUrl}/agent/v1/agents/${agentId}/threads/${threadId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const { deleted } = await response.json();
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

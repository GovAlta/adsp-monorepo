---
layout: page
title: Task service
nav_order: 11
parent: Services
---

# Task service
Task service provides a model for tasks, queues, and work assignment.

## Client roles
client `urn:ads:platform:task-service`

| name | description |
|:-|:-|
| task-admin | Administrator role for task service. This role allows a user to read, updated, and assign tasks. |
| task-writer | Writer role for task service. This role allows a user to update tasks. |
| task-reader | Reader role for task service. This role allows a user to access tasks across queues. |

User access is primary controlled via configuration on each queue with `workerRoles` and `assignerRoles` representing: the roles that grant permission to assign and prioritize tasks; and roles that grant permission to self-assign, start, and complete tasks.

## Concepts
### Queue
Queue represents a particular work unit with roles for works and assigners and a ordered stream of *tasks*. Tasks default to first in-first out order and tasks with a higher priority are promoted to the front. Queues are configured in the [configuration service](configuration-service.md) under the `platform:task-service` namespace and name.

### Task
Task represents a unit of work in a *queue*. Each task has basic name and description as well as a priority. Tasks have a basic lifecycle of: Pending -> In Progress -> Stopped (optional) -> Completed or Cancelled.

### Assignment
*Tasks* are assigned to people for completion. Each task can be assigned to one person at a time (sole responsibility). Workers can self-assign tasks and assigners can assign tasks to others.

## Code examples
### Configure a queue
Queues are configured using the [configuration service](configuration-service.md). Note that new configuration may take up to 15 mins to apply.

```typescript
  const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';

  const namespace = 'my-service';
  const name = 'intake-submissions';
  const request = {
    operation: 'UPDATE',
    update: {
      queues: {
        [`${namespace}:${name}`]: {
          namespace,
          name,
          context: {},
          assignerRoles: ['intake-supervisors'],
          workerRoles: ['intake-assessors'],
        }
      }
    }
  }

  await fetch(
    `${configurationServiceUrl}/configuration/v1/configuration/platform/task-service`,
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

### Create and queue a task
```typescript
  const namespace = 'support';
  const name = 'intake-processing';
  const task = {
    name: 'process-application-123',
    description: 'Process Application 123',
    priority: 'Normal',
    recordId: 'f669be59-bd38-4ca4-8749-19248060fc63',
  }

  await fetch(
    `https://task-service.adsp.alberta.ca/task/v1/queues/${namespace}/${name}/tasks`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    }
  );
```

### Get queued tasks
Tasks are returned in order with highest priority tasks first and, within each priority, oldest tasks first.
```typescript
  const namespace = 'support';
  const name = 'intake-processing';
  const top = 20;

  await fetch(
    `https://task-service.adsp.alberta.ca/task/v1/queues/${namespace}/${name}/tasks?top=${top}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
```

### Assign a task
Tasks can be assigned by users with one of the assigner roles for the queue or self-assigned by users with one of the worker roles.

```typescript
  const taskServiceUrl = 'https://task-service.adsp.alberta.ca';
  const taskId = 'b7aba911-7bd9-485e-b0e9-416506f025d9';
  const namespace = 'support';
  const name = 'intake-processing';
  const request = {
    operation: 'assign',
    assignTo: {
      id: 'ed2243ed-948a-4f84-a785-c9cf2d5f355e',
      email: 'a.n.other@gov.ab.ca',
      name: 'A. N. Other',
    },
  }

  await fetch(
    `${taskServiceUrl}/task/v1/queues/${namespace}/${name}/tasks/${taskId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );
```

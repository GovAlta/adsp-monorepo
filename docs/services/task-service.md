---
layout: page
title: Task service
parent: Services
---

# Task service

Task service provides a model for tasks, queues, and work assignment. Applications create tasks in a queue, and the
people who hold the queue's roles assign, start, and complete them. The [task app](../tutorials/task-service/task-app.md)
is a ready-made user interface for working on queued tasks.

## Client roles

client `urn:ads:platform:task-service`

| name        | description                                                                                                                                                                                                 |
| :---------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| task-admin  | Administrator role for tasks, definitions, and queues. Grants access to tasks in every queue, and allows a user to update, assign, prioritize, cancel, and delete tasks. Included in the tenant admin role. |
| task-writer | Writer role for creating and updating tasks. Allows a user or service account to create tasks in any queue, and to update and prioritize tasks they can access.                                             |
| task-reader | Reader role for access tasks. Grants read access to tasks in every queue, and allows a user to cancel tasks.                                                                                                |

Access to the tasks of a queue is mostly controlled by roles in the queue's configuration rather than by these client
roles. Each queue has:

- `workerRoles`: roles that grant permission to view the queue's tasks, assign tasks to yourself, and start, update the
  data of, complete, and cancel tasks that are unassigned or assigned to you.
- `assignerRoles`: roles that grant permission to view the queue's tasks, assign tasks to anyone (or unassign them), set
  task priority, and cancel tasks.

Queue roles are tenant roles (for example `intake-assessor`) or client roles in the qualified form `<client ID>:<role>`
(for example `urn:ads:example:intake-app:assessor`). The task-admin role can do everything an assigner can, but working
on a task (start, update data, complete) always requires a worker role.

Two platform roles are also accepted for specific integrations: the directory service `resource-resolver` role can
retrieve a task by ID, and the export service `export-job` role can retrieve tasks.

## Tenancy

- **Which tenant is used?** Tenant users and service accounts always act on the tenant of their token, and any
  `tenantId` query parameter is ignored. Core (platform) users and service accounts must set the `tenantId` query
  parameter (for example `?tenantId=urn:ads:platform:tenant-service:v2:/tenants/{id}`).
- **Without a tenant context**, the `/tasks` endpoints and the endpoints for a specific queued task respond `400`. Other
  queue endpoints don't respond with a clear error, so always set `tenantId` as a core user.
- **Queues** are tenant configuration. Each tenant configures its own queues, and there are no platform queues shared
  with tenants.
- **Isolation**: tasks are stored per tenant. A task ID from another tenant responds `404`, as does a task ID used under
  a queue path that isn't the task's queue.
- **Role scope**: the task service and queue roles must be held in the tenant of the task. Core users with one of the
  roles that grant access to a queue (task-admin, task-reader, or a worker or assigner role) can read queue metrics,
  queued tasks, and individual tasks, and cancel tasks; core users with task-admin or task-writer can create tasks. The
  `GET /tasks` list accepts only the export service export-job role from core users. Only tenant users can update,
  assign, work on, or delete tasks.
- **Assigners and workers lists** are read from the tenant's Keycloak realm with the caller's own token, so they only
  work for tenant users who can view users of the realm.

## API overview

All endpoints are under `https://task-service.adsp.alberta.ca/task/v1` and require a bearer token. See the
[API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Area         | Endpoints                                                                            | Required role                                                                           |
| :----------- | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| Queues       | `GET /queues`, `GET /queues/{namespace}/{name}`                                      | Any authenticated user of the tenant                                                    |
|              | `GET /queues/{namespace}/{name}/metrics`, `GET /queues/{namespace}/{name}/tasks`     | task-admin, task-reader, or a worker or assigner role of the queue                      |
|              | `GET /queues/{namespace}/{name}/assigners`, `GET /queues/{namespace}/{name}/workers` | None, but the user must be able to view users in Keycloak (realm-management view-users) |
| Create tasks | `POST /queues/{namespace}/{name}/tasks`                                              | task-admin or task-writer                                                               |
| Tasks        | `GET /tasks`                                                                         | task-admin or task-reader (or the export service export-job role)                       |
|              | `GET /tasks/{id}`, `GET /queues/{namespace}/{name}/tasks/{id}`                       | task-admin, task-reader, or a worker or assigner role of the queue                      |
|              | `PATCH /tasks/{id}`, `PATCH /queues/{namespace}/{name}/tasks/{id}`                   | task-admin, or task-writer with access to the task                                      |
|              | `POST /tasks/{id}`, `POST /queues/{namespace}/{name}/tasks/{id}` (operations)        | Depends on the operation; see [Task operations](#task-operations)                       |
|              | `PATCH /tasks/{id}/data`, `PATCH /queues/{namespace}/{name}/tasks/{id}/data`         | A worker role of the queue, on a task that is unassigned or assigned to the user        |
|              | `DELETE /tasks/{id}`                                                                 | task-admin                                                                              |

The queue paths for a specific task behave like the `/tasks/{id}` paths, but also check that the task is in that queue.
There are no endpoints for creating or deleting queues: queues are configured through the
[configuration service](configuration-service.md) (see [Configure a queue](#configure-a-queue)).

## Concepts

### Queue

Queue represents a particular work unit with roles for workers and assigners and an ordered stream of _tasks_. Tasks
are ordered with the highest priority first and, within each priority, oldest first. Queues are identified by a
`namespace` and `name` (each up to 50 characters), and configured in the
[configuration service](configuration-service.md) under the `platform:task-service` namespace and name, keyed by
`<namespace>:<name>`.

### Task

Task represents a unit of work in a _queue_. Each task has a name and description, a priority (`Normal`, `High`, or
`Urgent`), an optional `recordId` for cross-referencing an application record, and application-defined `context` and
`data`. Tasks have a basic lifecycle of: Pending -> In Progress -> Completed, or Cancelled from Pending or In Progress.
The `Stopped` status is part of the model and metrics, but no operation sets it.

### Assignment

_Tasks_ are assigned to people for completion. Each task can be assigned to one person at a time (sole
responsibility). Workers can self-assign tasks and assigners can assign tasks to others or unassign them. Completed and
cancelled tasks can't be assigned.

### Task operations

Changes in a task's lifecycle are made by posting an operation to the task:

| Operation      | Effect                                     | Allowed for                                                                     |
| :------------- | :----------------------------------------- | :------------------------------------------------------------------------------ |
| `assign`       | Assigns (or with no `assignTo`, unassigns) | task-admin or an assigner role; a worker role to assign the task to themselves  |
| `set-priority` | Sets `priority` to Normal, High, or Urgent | task-admin, task-writer, or an assigner role                                    |
| `start`        | Pending -> In Progress                     | A worker role, on a task that is unassigned or assigned to the user             |
| `complete`     | In Progress -> Completed                   | A worker role, on a task that is unassigned or assigned to the user             |
| `cancel`       | Pending or In Progress -> Cancelled        | Any user who can access the task; an optional `reason` is included in the event |

In every case the user must first be able to access the task (task-admin, task-reader, or a worker or assigner role of
the queue). An operation that the task's status doesn't allow responds `400`.

### Comments

When a task is created, the task service creates a [comment service](comment-service.md) topic for it, with the
`task-comments` topic type. Users with the task-reader role can comment, and task-admin can administer the topic.

## Events

The task service sends the following domain events under the `task-service` namespace:

| Event               | Description                                                     |
| :------------------ | :-------------------------------------------------------------- |
| `task-created`      | A task was created.                                             |
| `task-updated`      | A task's name, description, context, priority, or data changed. |
| `task-data-updated` | A task's data was replaced through the data endpoint.           |
| `task-priority-set` | A task's priority was set.                                      |
| `task-assigned`     | A task was assigned or unassigned.                              |
| `task-started`      | A task was started.                                             |
| `task-completed`    | A task was completed.                                           |
| `task-cancelled`    | A task was cancelled.                                           |
| `task-deleted`      | A task was deleted.                                             |

Events use the task's `recordId` (or its URN) as correlation ID, and include the queue in their context. The event
service records the time between `task-created` and `task-started` and between `task-started` and `task-completed`,
which the queue metrics endpoint reports. The `task-updates` stream of the [push service](push-service.md) delivers
all of these events to users with the task-reader or task-admin role.

The task service doesn't consume events.

## Code examples

### Configure a queue

Queues are configured using the [configuration service](configuration-service.md). The task service caches its
configuration and clears the cache when the configuration changes.

```typescript
const namespace = 'support';
const name = 'intake-processing';
const request = {
  operation: 'UPDATE',
  update: {
    queues: {
      [`${namespace}:${name}`]: {
        namespace,
        name,
        displayName: 'Intake processing',
        context: {},
        assignerRoles: ['intake-supervisor'],
        workerRoles: ['intake-assessor'],
      },
    },
  },
};

await fetch('https://configuration-service.adsp.alberta.ca/configuration/v2/configuration/platform/task-service', {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

### Create and queue a task

Requires the task-admin or task-writer role. The response is the created task, with status `Pending`.

```typescript
const namespace = 'support';
const name = 'intake-processing';
const task = {
  name: 'process-application-123',
  description: 'Process application 123',
  priority: 'Normal',
  recordId: 'f669be59-bd38-4ca4-8749-19248060fc63',
  context: { application: 'intake' },
};

const response = await fetch(`https://task-service.adsp.alberta.ca/task/v1/queues/${namespace}/${name}/tasks`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(task),
});
const { id, urn, status } = await response.json();
```

### Get queued tasks

Returns the tasks of the queue that are not completed or cancelled, with the highest priority tasks first and, within
each priority, oldest tasks first. Use `page.next` as the `after` parameter to get the next page.

```typescript
const namespace = 'support';
const name = 'intake-processing';
const top = 20;

const response = await fetch(
  `https://task-service.adsp.alberta.ca/task/v1/queues/${namespace}/${name}/tasks?top=${top}`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);
const { results, page } = await response.json();
// results[0].id, results[0].priority, results[0].assignment; page.next
```

### Assign a task

Tasks can be assigned by users with one of the assigner roles for the queue or self-assigned by users with one of the
worker roles. Use the workers endpoint to list the users who can be assigned.

```typescript
const taskId = 'b7aba911-7bd9-485e-b0e9-416506f025d9';
const namespace = 'support';
const name = 'intake-processing';
const request = {
  operation: 'assign',
  assignTo: {
    id: 'ed2243ed-948a-4f84-a785-c9cf2d5f355e',
    email: 'test.user@gov.ab.ca',
    name: 'Test User',
  },
};

const response = await fetch(
  `https://task-service.adsp.alberta.ca/task/v1/queues/${namespace}/${name}/tasks/${taskId}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  },
);
const { assignment } = await response.json();
// assignment.assignedTo.id, assignment.assignedOn
```

### Start and complete a task

A worker starts a task, optionally records data while it is in progress, and then completes it.

```typescript
const taskUrl = `https://task-service.adsp.alberta.ca/task/v1/tasks/${taskId}`;
const headers = {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
};

await fetch(taskUrl, { method: 'POST', headers, body: JSON.stringify({ operation: 'start' }) });

await fetch(`${taskUrl}/data`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ decision: 'approved', notes: 'All documents received.' }),
});

const response = await fetch(taskUrl, { method: 'POST', headers, body: JSON.stringify({ operation: 'complete' }) });
const { status, endedOn } = await response.json();
// status === 'Completed'
```

### Get queue metrics

Returns task counts by status, priority, and assigned user. With `includeEventMetrics=true`, it also returns the weekly
queue and completion durations (in seconds) and the number of tasks created, completed, and cancelled in the last 7
days.

```typescript
const response = await fetch(
  `https://task-service.adsp.alberta.ca/task/v1/queues/${namespace}/${name}/metrics?notEnded=true&includeEventMetrics=true`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);
const { status, priority, assignedTo, queue, completion, rate } = await response.json();
// status.Pending, priority.Urgent, queue.avg, rate.created
```

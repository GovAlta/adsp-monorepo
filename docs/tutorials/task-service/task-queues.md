---
title: Task Queues
layout: page
nav_order: 2
parent: Task Service
grand_parent: Tutorials
---

## Task Queues

Task queues hold time-ordered sets of information that require processing, either by individuals or computer algorithms. Tasks can be scheduled, prioritized, and assigned to owners. Larger tasks might include subtasks or milestones. However, the task queue itself does not specify the type of data it contains; any type of data can be pushed onto a queue. It is the responsibility of the application developer to [define the data types](/adsp-monorepo/tutorials/task-service/task-definitions.html) and ensure the consistency of the queue's contents.

Queues are part of your tenant's task service configuration, and the tasks in them are stored by the service. You work with both through the task service APIs.

To start using the service, login to the ADSP Tenant-management-webapp and select the _Task Service_. There you will be able to create your first _task queue_. Queues are identified by a _namespace:name_ pair which you specify when creating one. There is no particular significance to the naming convention, it just gives you a means to help organize things when the number of queues in your tenant are large.

## Metrics

Several queue metrics are tracked by the Task Service, including

- the number of tasks with a given status
- the number of tasks with a given priority
- the number of tasks assigned to each user
- the average, minimum, and maximum time tasks wait in the queue before they are started, and take from start to completion, over the last week
- the number of tasks created, completed, and cancelled in the last 7 days

The counts can be restricted to active tasks only (tasks that are not completed or cancelled), and the time and rate metrics are only included when requested.

## Security

Developers must assign access roles to each _queue_ created. The _Task Service_ defines two types of users:

- **Assigner**: Assigners are able to view the queue's tasks, assign tasks to individuals for completion, and set task priority.
- **Worker**: Workers are able to view the queue's tasks, assign tasks to themselves, and start and complete them.

In the Tenant-Management-Webapp developers can assign user types to one or more tenant-defined keycloak roles. Note: this security is important enough that this step is mandatory. If, when testing you find you are getting 403's, make sure your test user has the right tenant-defined roles. You can assign user types to these roles via the _Queue permissions_ pane in the Queue editor:

![](/adsp-monorepo/assets/task-service/queuePermissions.png){: width="800" }

In addition to the _queue specific_ roles, the task service has the following roles, which apply across all queues:

- **task-reader**: Users can see the tasks of every queue, but are unable to update them.
- **task-writer**: Users and service accounts can create tasks, and update tasks they can see.
- **task-admin**: Users can see, update, assign, prioritize, and delete tasks in every queue.

## APIs

Once your queue is created you can then start accessing it through [the APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Task%20service). There are endpoints to:

- push data onto a queue
- assign individuals to a task
- retrieve lists of workers and assigners
- retrieve queue metrics

as well as other, basic, CRUD operations. Note: you cannot remove queues that have tasks within them.

## Events

Various events are triggered throughout the lifecycle of a task. These events can notify users about important developments. Additionally, all events are logged to ensure traceability and auditability. The events include:

- task-updated
- task-created
- task-priority-set
- task-assigned
- task-started
- task-data-updated
- task-completed
- task-cancelled
- task-deleted

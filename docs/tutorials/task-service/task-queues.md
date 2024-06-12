---
title: Task Queues
layout: page
nav_order: 2
parent: Task Service
grand_parent: Tutorials
---

## Task Queues

Task queues hold time-ordered sets of information that require processing, either by individuals or computer algorithms. Tasks can be scheduled, prioritized, and assigned to owners. Larger tasks might include subtasks or milestones. However, the task queue itself does not specify the type of data it contains; any type of data can be pushed onto a queue. It is the responsibility of the application developer to [define the data types](/adsp-monorepo/tutorials/task-service/task-definitions.html) and ensure the consistency of the queue's contents.

The service uses [RabbitMQ](https://www.rabbitmq.com/) for task management. The latter is not exposed to developers; however, it is managed by an abstract set of API wrappers that ensure easy, fault-tolerant, access to the underlying message queuing framework.

To start using the service, login to the ADSP Tenant-management-webapp and select the _Task Service_. There you will be able to create your first _task queue_. Queues are identified by a _namespace:name_ pair which you specify when creating one. There is no particular significance to the naming convention, it just gives you a means to help organize things when the number of queues in your tenant are large.

In addition you must associate one or more roles with the queue, which will be used for authorization when accessing the service through the APIs. Only authorized users - those with the correct role(s) - will be able to read/write information to your queue.

![](/adsp-monorepo/assets/task-service/createQueue.png){: width="600" }

## Metrics

Several queue metrics are tracked by the Task Service, including

- the average, min, and max size of the queue
- the number of tasks created, completed, and cancelled since queue creation
- the number of tasks with a given status
- the number of tasks with a given priority
- the average, minimum, and maximum number of active tasks

The metrics can be filtered by active tasks only, and the information restricted to just status and priority metrics.

## APIs

Once your queue is created you can then start accessing it through [the APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Task%20service). There are endpoints to:

- push data onto a queue
- assign individuals to a task
- retrieve lists of workers and assigners
- retrieve queue metrics

as well as other, basic, CRUD operations. Note: you cannot remove queues that have tasks within them.

## Events

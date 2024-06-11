---
title: Introduction
layout: page
nav_order: 1
parent: Task Service
grand_parent: Tutorials
---

## Introduction

The _Task Service_ is designed to help application create a persistent, ordered, prioritized, set of tasks for later processing. A task, for the purposes of this service, is defined to be an abstract _work item_ that can be assigned to a user for completion. It could be, for example, an assignment to review a recent _Application for a Farmer's Market License_. When the application is submitted by the end user, the intake application would create a new _review task_ for another application to pick up when needed. The key point here is that applications are now able to easily _decouple_ task creation from task processing, which allows for asynchronous processing, load balancing, and application scalability.

The service is based on message queues, and consists of a set of APIs that allow developers to create and manage task queues. In addition, there is also a generic _Task Application_ that can be used to process certain pre-defined tasks, such as [form submissions](/adsp-monorepo/tutorials/form-service/introduction.html).

As with most ADSP services, the task service is a highly scalable microservice deployed on the Government's ARO servers so that developers can use it with confidence.

## Message Queues

The task service uses [RabbitMQ](https://www.rabbitmq.com/) for task management. The latter is not exposed to developers; however, it is managed by an abstract set of API wrappers that ensure easy, fault-tolerant, access to the underlying message queuing framework.

To start using the service, login to the ADSP Tenant-management-webapp and select the _Task Service_. There you will be able to create your first _message queue_. Queues are identified by a _namespace:name_ pair which you specify when creating one. There is no particular significance to the naming convention, it just gives you a means to help organize things when the number of queues in your tenant are large.

In addition you must associate one or more roles with the queue, which will be used for authorization when accessing the service through the APIs. Only authorized users - those with the correct role(s) - will be able to read and write information to your queue.

![](/adsp-monorepo/assets/task-service/createQueue.png){: width="600" }

Once your queue is created you can then start accessing it through [the APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Task%20service).

## Task Definitions

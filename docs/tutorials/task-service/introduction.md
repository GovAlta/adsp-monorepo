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

### Learn More

Learn how to create and use [Task Queues](/adsp-monorepo/tutorials/task-service/task-queues.html) in your application.

Learn how [tasks are defined](/adsp-monorepo/tutorials/task-service/task-definitions.html).

Learn about the use of the [task app](/adsp-monorepo/tutorials/task-service/task-app.html) to deliver _form review_ capabilities to your clients, without deployment.

---
title: Introduction
layout: page
nav_order: 1
parent: Task Service
grand_parent: Tutorials
---

## Introduction

The _Task Service_ is designed to assist applications in creating a persistent, ordered, and prioritized set of tasks for later processing. For the purposes of this service, a task is defined as an abstract work item that can be assigned to a user for completion. For example, it could involve reviewing a recent _Application for a Farmer’s Market License_. When an end user submits an application, the intake system generates a new review task, which another application can pick up as needed. The key benefit is that applications can easily decouple task creation from task processing, enabling asynchronous processing, load balancing, and improved scalability.

The service is based on message queues, and consists of a set of APIs that allow developers to create and manage task queues. In addition, there is also a generic _Task Application_ that can be used to process certain pre-defined tasks, such as [form submissions](/adsp-monorepo/tutorials/form-service/introduction.html).

As with most ADSP services, the task service is a highly scalable microservice deployed on the Government's ARO servers so that developers can use it with confidence.

### Learn More

Learn how to create and use [Task Queues](/adsp-monorepo/tutorials/task-service/task-queues.html) in your application.

Learn how [tasks are defined](/adsp-monorepo/tutorials/task-service/task-definitions.html).

Learn about the use of the [task app](/adsp-monorepo/tutorials/task-service/task-app.html) to deliver _form review_ capabilities to your clients, without deployment.

---
title: Task Definitions
layout: page
nav_order: 3
parent: Task Service
grand_parent: Tutorials
---

## Task

A task is defined by:

- a name,
- a priority [normal, high, urgent],
- an optional description,
- an optional, generic, application defined ID string,
- an application defined context.

### Name

The name is used to identify the type of task to be performed, such as "Form Review", or "Signature Required". Between the name and the description a worker should be able to determine what is being requested of them.

### Record ID

The record ID is used to associate data with the task. For example, the _form review_ task would use the ID of the form intake data, so the application can display the data to be reviewed. Of course, the record ID is just a string without any a-priori meaning associated with it. You can use it for anything, really.

### Context

The context is used to provide any extra information that is needed for the worker to complete the task; things such as:

- its difficulty,
- its time frame,
- constraints,
- resource references,
- etc.

In the end, the context depends entirely on what sort of task is being defined. Therefore the context is simply defined as a generic JSON object that gets associated with the task, and it is up to the application to define and interpret its data.

Developers should try to keep the concept of _context_ separate from that of _data_ (the record ID). Data is the specific information or material that the task processes or analyzes, while context is the set of conditions, constraints, and circumstances that affect _how_ the task is performed.

## APIs

There are several [API endpoints](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Task%20service) that provide the basic operations needed to manage tasks within a queue. These operations include:

- assigning workers to tasks
- setting task priority
- managing task status

as well as the basic CRU operations for adding, updating, and retrieving the data. Note: tasks cannot be deleted, then can only be cancelled or completed.

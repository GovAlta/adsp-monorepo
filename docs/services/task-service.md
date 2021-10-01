---
layout: page
title: Task service
nav_order: 10
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
Queue represents a particular work unit with roles for works and assigners and a ordered stream of *tasks*. Tasks default to first in-first out order and tasks with a higher priority are promoted to the front.

### Task
Task represents a unit of work in a *queue*. Each task has basic name and description as well as a priority. Tasks have a basic lifecycle of: Pending -> In Progress -> Stopped (optional) -> Completed or Cancelled.

### Assignment
*Tasks* are assigned to people for completion. Each task can be assigned to one person at a time (sole responsibility). Workers can self-assign tasks and assigners can assign tasks to others.

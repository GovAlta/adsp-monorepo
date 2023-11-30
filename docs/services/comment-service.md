---
layout: page
title: Comment service
nav_order: 16
parent: Services
---

# Comment service
Comment service allows users to create topics and post comments against the topics. Topics are of a particular topic type, and the type determines the roles permitted to administer, read, or comment on a topic.

A topic is intended to be an aggregate root for comments, and should be associated to an entity that is the subject of the comments. Topic includes a `resourceId` property for referencing the associated entity. For example, in a case management use case, a topic references a case using the case ID, and comments regarding the case are children of that topic.

## Client roles
client `urn:ads:platform:comment-service`

| name | description |
|:-|:-|
| comment-admin | Administrator role that grants permission to administer topics and comments. |
| topic-setter | Topic setter role that grants permissions to managed topics. |

Topic administer, read, or comment access is controlled by configuration of `adminRoles`, `readerRoles`, and `commenterRoles` on each topic type.

## Concepts
### Topic type
Topic type is configuration for a category of *topics*. The type includes configuration of roles allowed to administer, read, or comment on topics of the type. Topic types are configured in the [configuration service](configuration-service.md) under the `platform:comment-service` namespace and name.

### Topic
Topics are aggregate roots of *comments* and represent the subject of associated *comments*. Topics are intended to reference entities in other domain models so that comments can be recorded against any entity.

### Comment
Comments represent user authored descriptive information regarding a *topic* like notes or discussions.

## Code examples

### Create a topic
Create a topic referencing a case so that comments on the case can be created. `typeId` is the ID of a configured Topic type.

```typescript
  const response = await fetch(
    'https://comment-service.adsp.alberta.ca/comment/v1/topics',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: {
        typeId: 'case-notes',
        name: 'Comments on Case-123'
        resourceId: 'urn:ads:demo:case-services:v1:/cases/case-123'
      },
    }
  );

  const {
    id,
    urn,
    name,
    resourceId,
    securityClassification
  } = await response.json();
```

### Add a comment to a topic
Add a comment against an existing topic, so that it can be retrieved and read later.

```typescript
  const response = await fetch(
    `https://comment-service.adsp.alberta.ca/comment/v1/topics/${topicId}/comments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: {
        title,
        comment
      },
    }
  );

  const {
    id,
    title,
    comment,
    createdBy
  } = await response.json();
```

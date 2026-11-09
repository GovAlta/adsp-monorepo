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

These client roles grant the following:

- **comment-admin** is an administrator of every topic type of the tenant: it can read and comment on any topic, and update or delete any comment. It can also manage topic types and topics, and search comments across topics with `GET /comments`. It is included in the tenant admin role.
- **topic-setter** is for the applications and service accounts that set up topics. It can manage topic types, create, update, and delete topics, and read any topic and its comments. It doesn't grant permission to post comments.

Both roles also work as core (platform) roles for managing topic types and topics, and reading topics. Comment and administrator access through a topic type (below) requires a role held in the tenant.

### Topic type roles
Access to the comments of a topic is mostly set by its *topic type*, which configures three lists of roles. The roles are any roles of the tenant's users, for example realm roles or client roles of the tenant's own applications. A user needs one of the roles, held in the topic's tenant:

| Topic type property | Permits |
|:-|:-|
| `adminRoles` | Read topics of the type, post comments, and update or delete any comment. The comment-admin role always has this access. |
| `commenterRoles` | Read topics of the type, post comments, and update or delete the user's own comments. |
| `readerRoles` | Read topics of the type and their comments. |

A topic can also list user IDs in its `commenters`, for people outside these roles, like the person a case is about. Commenters can read the topic and post comments, and update or delete their own comments. Comments returned to them have the names of other users removed.

Two roles of other platform services also apply:

- The [directory service](directory-service.md) `urn:ads:platform:directory-service:resource-resolver` role can retrieve any topic, so that topic URNs resolve to their names.
- The export service `urn:ads:platform:export-service:export-job` role can list all topics and search comments, so topics and comments can be exported.

## Tenancy
Topic types, topics, and comments all belong to one tenant.

- **Tenant users and service accounts** always act on the tenant of their token. Any `tenantId` query parameter is ignored.
- **Core (platform) users and service accounts** have no tenant of their own, so they must set the `tenantId` query parameter (for example, `?tenantId=urn:ads:platform:tenant-service:v2:/tenants/{id}`) on every request. A value that isn't a tenant URN responds `400`. Only `GET /topic-types` handles a missing tenant, by returning just the platform topic types; other endpoints fail without a clear error, so always include it.
- **Topic types** combine *platform* types (configured by ADSP for all tenants) with the tenant's own types. A tenant type with the same ID as a platform type replaces it. Topics can use either. `GET /topic-types` returns them separately as `tenant` and `core`, while `GET`, `PATCH`, and `DELETE /topic-types/{topicTypeId}` act only on the tenant's own types, so platform types respond `404` there.
- **Isolation.** A topic or comment ID from another tenant responds `404`, not `403`, so callers can't tell whether it exists.
- **Role scope.** Roles in a topic type's `adminRoles`, `commenterRoles`, and `readerRoles`, and the comment-admin role for comments, must be held in the topic's tenant. The comment-admin and topic-setter roles grant topic type and topic management, and reading topics, as core roles too. `GET /comments` accepts only tenant roles.

## API overview
All endpoints are under `https://comment-service.adsp.alberta.ca/comment/v1` and require a bearer token. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Area | Endpoints | Required role |
|:-|:-|:-|
| Topic types | `GET /topic-types`, `POST /topic-types`, `GET\|PATCH\|DELETE /topic-types/{topicTypeId}` | comment-admin or topic-setter |
| Topics | `GET /topics` | Any authenticated user; results include only topics the user can read |
| | `POST /topics`, `PATCH\|DELETE /topics/{topicId}` | comment-admin or topic-setter |
| | `GET /topics/{topicId}` | Read access to the topic (see [Topic type roles](#topic-type-roles)), comment-admin, topic-setter, or the directory resource-resolver |
| Topic comments | `GET /topics/{topicId}/comments`, `GET /topics/{topicId}/comments/{commentId}` | Read access to the topic, comment-admin, or topic-setter |
| | `POST /topics/{topicId}/comments` | Comment access to the topic: the type's `adminRoles` or `commenterRoles`, comment-admin, or listed in the topic's `commenters` |
| | `PATCH\|DELETE /topics/{topicId}/comments/{commentId}` | The type's `adminRoles` or comment-admin, or the comment's author with comment access |
| Comment search | `GET /comments` | comment-admin or export-job; with `criteria.typeIdEquals`, read access to the type instead |

Topic types are stored in the [configuration service](configuration-service.md). The `/topic-types` endpoints read and write that configuration for you, and you can also edit it there directly.

## Concepts
### Topic type
Topic type is configuration for a category of *topics*. The type includes configuration of roles allowed to administer, read, or comment on topics of the type (see [Topic type roles](#topic-type-roles)), and the security classification of new topics of the type. Topic types are configured in the [configuration service](configuration-service.md) under the `platform:comment-service` namespace and name, keyed by type ID. A topic type can't be deleted while topics of the type exist.

### Topic
Topics are aggregate roots of *comments* and represent the subject of associated *comments*. Topics are intended to reference entities in other domain models so that comments can be recorded against any entity, using `resourceId`. Each topic has a URN (`urn:ads:platform:comment-service:v1:/topics/{id}`) that the [directory service](directory-service.md) can resolve. A topic's `requiresAttention` flag is set or cleared by the `requiresAttention` value of a new comment, for example so that a worker can find topics with unanswered questions. Deleting a topic also deletes its comments.

### Comment
Comments represent user authored descriptive information regarding a *topic* like notes or discussions. A comment has an optional `title`, `content`, and an optional `context` object for application data, such as the step of a process the comment is about.

## Events
The comment service sends the following domain events under the `comment-service` namespace. Each event includes the topic, and the comment events also include the comment. The correlation ID is the topic's `resourceId`, or the topic URN when it has none.

| Event | Description |
|:-|:-|
| `topic-created` | Signalled when a topic is created. |
| `topic-updated` | Signalled when a topic is updated. |
| `topic-deleted` | Signalled when a topic is deleted. |
| `comment-created` | Signalled when a comment is created. |
| `comment-updated` | Signalled when a comment is updated. |
| `comment-deleted` | Signalled when a comment is deleted. |

The service doesn't consume events from other services. Changes to topic types are configuration updates, recorded by the [configuration service](configuration-service.md).

## Code examples
### Create a topic type
Users or service accounts with the comment-admin or topic-setter role can create topic types for their tenant. The new type's commenter roles are set with `writeRoles`, and it has no admin roles until you update it. The service responds `409` if a type with the ID or name already exists.

```typescript
const response = await fetch('https://comment-service.adsp.alberta.ca/comment/v1/topic-types', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'case-notes',
    name: 'Case notes',
    readerRoles: ['case-auditor'],
    writeRoles: ['case-worker'],
  }),
});

const { id, name, readerRoles, commenterRoles } = await response.json();
```

### Update the roles of a topic type
Properties not in the request keep their values.

```typescript
const response = await fetch('https://comment-service.adsp.alberta.ca/comment/v1/topic-types/case-notes', {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    adminRoles: ['case-supervisor'],
    securityClassification: 'protected b',
  }),
});

const { adminRoles, commenterRoles, readerRoles, securityClassification } = await response.json();
```

### Create a topic
Create a topic referencing a case so that comments on the case can be created. `typeId` is the ID of a configured topic type. A platform service account also sets the `tenantId` query parameter.

```typescript
const response = await fetch('https://comment-service.adsp.alberta.ca/comment/v1/topics', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    typeId: 'case-notes',
    name: 'Comments on case-123',
    resourceId: 'urn:ads:demo:case-service:v1:/cases/case-123',
  }),
});

const { id, urn, name, resourceId, securityClassification } = await response.json();
```

### Find the topic of an entity
Criteria are URL-encoded JSON. Results include only the topics the user can read.

```typescript
const criteria = JSON.stringify({ resourceIdEquals: 'urn:ads:demo:case-service:v1:/cases/case-123' });
const response = await fetch(
  `https://comment-service.adsp.alberta.ca/comment/v1/topics?criteria=${encodeURIComponent(criteria)}`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);

const { results, page } = await response.json();
const topicId = results[0]?.id;
```

### Add a comment to a topic
Add a comment against an existing topic, so that it can be retrieved and read later. Set `requiresAttention` to flag the topic for follow up.

```typescript
const response = await fetch(`https://comment-service.adsp.alberta.ca/comment/v1/topics/${topicId}/comments`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Follow up call',
    content: 'Called the applicant to confirm the mailing address.',
    requiresAttention: true,
  }),
});

const { id, title, content, createdBy, createdOn } = await response.json();
```

### Read the comments of a topic
Comments are returned newest first. Use `page.next` as the `after` value to get the next page.

```typescript
const response = await fetch(
  `https://comment-service.adsp.alberta.ca/comment/v1/topics/${topicId}/comments?top=20`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);

const { results, page } = await response.json();
const nextPage = page.next;
```

### Search comments of a topic type
Users who can read a topic type can search comments across its topics. Without `typeIdEquals`, the search requires the comment-admin role.

```typescript
const criteria = JSON.stringify({ typeIdEquals: 'case-notes', titleOrContentLike: 'address' });
const response = await fetch(
  `https://comment-service.adsp.alberta.ca/comment/v1/comments?criteria=${encodeURIComponent(criteria)}`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);

const { results, page } = await response.json();
```

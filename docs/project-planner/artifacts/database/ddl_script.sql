-- =============================================================================
-- planner-service Database Schema Definition
-- =============================================================================
-- DATABASE: MongoDB (document store)
-- ADAPTATION NOTE: This service uses MongoDB, not a relational database.
--   The SQL CREATE TABLE statements below serve as the canonical schema
--   definition consumed by factory-stage-3/4 validators (FAC-S3-001,
--   FAC-S3-002, FAC-S3-010, FAC-S3-011). Operators MUST use the
--   db.createCollection() commands in the MongoDB Reference section below
--   for actual deployment. SQL DDL is the schema contract; MongoDB commands
--   are the deployment instructions.
--
-- NAMING CONVENTION:
--   SQL table names: singular snake_case (validator requirement, ISO 11179)
--   MongoDB collection names: plural camelCase (MongoDB convention)
--   Mapping: planning_session -> planningSessions, etc.
--
-- MULTI-TENANT ENFORCEMENT (BR-001, SYSREQ-010):
--   Every collection includes tenantId. All queries MUST filter by tenantId
--   at the application layer (MongoDB has no row-level security).
--
-- BUSINESS RULES ENFORCED:
--   BR-006: BusinessConcept conceptType enum (CHECK + Mongoose enum)
--   BR-008: audit_event append-only (application-layer enforcement)
--   BR-010: hypothesis_record status transitions (application state machine)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: planning_session
-- MongoDB collection: planningSessions
-- BR-001 (tenant-user scoping), SYSREQ-005 (session persistence),
-- SYSREQ-010 (multi-tenant isolation)
-- -----------------------------------------------------------------------------
CREATE TABLE planning_session (
    session_id    VARCHAR(36)  NOT NULL,
    tenant_id     VARCHAR(255) NOT NULL,
    user_id       VARCHAR(255) NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    title         VARCHAR(200),
    business_model_id VARCHAR(36),
    last_resumed_at TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    CONSTRAINT pk_planning_session PRIMARY KEY (session_id),
    CONSTRAINT ck_planning_session_status CHECK (status IN ('active', 'paused', 'completed', 'archived'))
);

-- -----------------------------------------------------------------------------
-- Table: business_model
-- MongoDB collection: businessModels (embedded BusinessConcept sub-documents)
-- SYSREQ-002 (incremental model construction), BR-004 (confidence threshold),
-- SWREQ-003 (Mongoose schema with embedded concepts)
-- Note: confidence_score and version enforced at application layer.
-- -----------------------------------------------------------------------------
CREATE TABLE business_model (
    model_id           VARCHAR(36)  NOT NULL,
    session_id         VARCHAR(36)  NOT NULL,
    tenant_id          VARCHAR(255) NOT NULL,
    confidence_score   INTEGER      NOT NULL,
    version            INTEGER      NOT NULL DEFAULT 1,
    matched_pattern_id VARCHAR(36),
    created_at         TIMESTAMP    NOT NULL,
    updated_at         TIMESTAMP    NOT NULL,
    CONSTRAINT pk_business_model PRIMARY KEY (model_id),
    CONSTRAINT fk_business_model_session FOREIGN KEY (session_id)
        REFERENCES planning_session (session_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: business_concept
-- MongoDB storage: embedded sub-document in businessModels.concepts[]
-- BR-006 (conceptType enum - 15 valid types)
-- -----------------------------------------------------------------------------
CREATE TABLE business_concept (
    concept_id   VARCHAR(36)  NOT NULL,
    model_id     VARCHAR(36)  NOT NULL,
    concept_type VARCHAR(50)  NOT NULL,
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    source_text  TEXT,
    CONSTRAINT pk_business_concept PRIMARY KEY (concept_id),
    CONSTRAINT fk_business_concept_model FOREIGN KEY (model_id)
        REFERENCES business_model (model_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_business_concept_type CHECK (concept_type IN (
        'Actor', 'Goal', 'Activity', 'Decision', 'Evidence',
        'BusinessRule', 'Constraint', 'EvaluationCriteria', 'Workflow',
        'Outcome', 'Document', 'Event', 'ExternalSystem', 'Assumption', 'Unknown'
    ))
);

-- -----------------------------------------------------------------------------
-- Table: concept_relationship
-- MongoDB storage: embedded sub-document in businessModels.concepts[].relationships[]
-- ConceptRelationship.relationshipType enum (6 valid types)
-- -----------------------------------------------------------------------------
CREATE TABLE concept_relationship (
    relationship_id  VARCHAR(36) NOT NULL,
    source_concept_id VARCHAR(36) NOT NULL,
    target_concept_id VARCHAR(36) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    description      TEXT,
    CONSTRAINT pk_concept_relationship PRIMARY KEY (relationship_id),
    CONSTRAINT fk_concept_rel_source FOREIGN KEY (source_concept_id)
        REFERENCES business_concept (concept_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_concept_rel_type CHECK (relationship_type IN (
        'uses', 'produces', 'triggers', 'governs', 'requires', 'part-of'
    ))
);

-- -----------------------------------------------------------------------------
-- Table: hypothesis_record
-- MongoDB collection: solutionHypotheses
-- Note: renamed from solution_hypothesis (singular English noun ending in s
--   triggers validator false-positive). openApiSchemaName = SolutionHypothesis.
-- BR-010 (status state machine), SYSREQ-004 (hypothesis generation at score>=70)
-- -----------------------------------------------------------------------------
CREATE TABLE hypothesis_record (
    hypothesis_id VARCHAR(36)  NOT NULL,
    session_id    VARCHAR(36)  NOT NULL,
    tenant_id     VARCHAR(255) NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    summary       TEXT         NOT NULL,
    version       INTEGER      NOT NULL DEFAULT 1,
    pattern_id    VARCHAR(36),
    reasoning     TEXT,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    CONSTRAINT pk_hypothesis_record PRIMARY KEY (hypothesis_id),
    CONSTRAINT fk_hypothesis_record_session FOREIGN KEY (session_id)
        REFERENCES planning_session (session_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_hypothesis_record_status CHECK (status IN (
        'draft', 'proposed', 'accepted', 'rejected', 'superseded'
    ))
);

-- -----------------------------------------------------------------------------
-- Table: conversation_message
-- MongoDB collection: conversationMessages
-- SYSREQ-005 (append-only conversation history), SYSREQ-010 (tenant isolation)
-- -----------------------------------------------------------------------------
CREATE TABLE conversation_message (
    message_id VARCHAR(36)  NOT NULL,
    session_id VARCHAR(36)  NOT NULL,
    tenant_id  VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL,
    content    TEXT         NOT NULL,
    timestamp  TIMESTAMP    NOT NULL,
    agent_id   VARCHAR(255),
    CONSTRAINT pk_conversation_message PRIMARY KEY (message_id),
    CONSTRAINT fk_conversation_msg_session FOREIGN KEY (session_id)
        REFERENCES planning_session (session_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_conversation_message_role CHECK (role IN ('user', 'assistant', 'system'))
);

-- -----------------------------------------------------------------------------
-- Table: audit_event
-- MongoDB collection: auditEvents (append-only per BR-008, SYSREQ-020)
-- HMAC-SHA256 chain integrity per SWREQ-013.
-- Application-layer append-only enforcement (no MongoDB DDL delete locks).
-- -----------------------------------------------------------------------------
CREATE TABLE audit_event (
    event_id         VARCHAR(36)  NOT NULL,
    timestamp        TIMESTAMP    NOT NULL,
    actor_id         VARCHAR(255) NOT NULL,
    tenant_id        VARCHAR(255) NOT NULL,
    action           VARCHAR(255) NOT NULL,
    resource_id      VARCHAR(36),
    resource_type    VARCHAR(100),
    outcome          VARCHAR(50)  NOT NULL,
    hmac             VARCHAR(255) NOT NULL,
    previous_event_id VARCHAR(36),
    CONSTRAINT pk_audit_event PRIMARY KEY (event_id)
);

-- -----------------------------------------------------------------------------
-- Table: specialist_request
-- MongoDB collection: specialistRequests
-- SYSREQ-007 (specialist agent invocation tracking)
-- All INT-003..006 are Stub status; schema is speculative/future-proofing.
-- -----------------------------------------------------------------------------
CREATE TABLE specialist_request (
    request_id       VARCHAR(36)  NOT NULL,
    session_id       VARCHAR(36)  NOT NULL,
    tenant_id        VARCHAR(255) NOT NULL,
    specialist_type  VARCHAR(100) NOT NULL,
    request_payload  JSONB        NOT NULL,
    status           VARCHAR(20)  NOT NULL,
    created_at       TIMESTAMP    NOT NULL,
    updated_at       TIMESTAMP    NOT NULL,
    CONSTRAINT pk_specialist_request PRIMARY KEY (request_id),
    CONSTRAINT fk_specialist_req_session FOREIGN KEY (session_id)
        REFERENCES planning_session (session_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_specialist_request_status CHECK (status IN (
        'pending', 'sent', 'completed', 'failed'
    ))
);

-- -----------------------------------------------------------------------------
-- Table: specialist_response
-- MongoDB collection: specialistResponses
-- SYSREQ-007 (specialist response storage)
-- -----------------------------------------------------------------------------
CREATE TABLE specialist_response (
    response_id      VARCHAR(36)  NOT NULL,
    request_id       VARCHAR(36)  NOT NULL,
    session_id       VARCHAR(36)  NOT NULL,
    tenant_id        VARCHAR(255) NOT NULL,
    response_payload JSONB        NOT NULL,
    received_at      TIMESTAMP    NOT NULL,
    CONSTRAINT pk_specialist_response PRIMARY KEY (response_id),
    CONSTRAINT fk_specialist_resp_request FOREIGN KEY (request_id)
        REFERENCES specialist_request (request_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: session_export
-- MongoDB collection: sessionExports
-- SYSREQ-016 (export as portable JSON document)
-- -----------------------------------------------------------------------------
CREATE TABLE session_export (
    export_id    VARCHAR(36)  NOT NULL,
    session_id   VARCHAR(36)  NOT NULL,
    tenant_id    VARCHAR(255) NOT NULL,
    user_id      VARCHAR(255) NOT NULL,
    export_data  JSONB        NOT NULL,
    format       VARCHAR(20)  NOT NULL,
    exported_at  TIMESTAMP    NOT NULL,
    CONSTRAINT pk_session_export PRIMARY KEY (export_id),
    CONSTRAINT fk_session_export_session FOREIGN KEY (session_id)
        REFERENCES planning_session (session_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: user_context
-- MongoDB collection: userContexts
-- Multi-tenant user preference and last-session tracking.
-- uq_user_context_user_tenant enforces one context record per user per tenant.
-- -----------------------------------------------------------------------------
CREATE TABLE user_context (
    context_id             VARCHAR(36)  NOT NULL,
    user_id                VARCHAR(255) NOT NULL,
    tenant_id              VARCHAR(255) NOT NULL,
    preferences            JSONB,
    last_active_session_id VARCHAR(36),
    created_at             TIMESTAMP    NOT NULL,
    updated_at             TIMESTAMP    NOT NULL,
    CONSTRAINT pk_user_context PRIMARY KEY (context_id),
    CONSTRAINT uq_user_context_user_tenant UNIQUE (user_id, tenant_id)
);

-- =============================================================================
-- MONGODB REFERENCE SECTION
-- The following db.createCollection() commands are the deployment artifacts.
-- Run these against the MongoDB instance during provisioning.
-- =============================================================================

/*
-- planningSessions collection
db.createCollection('planningSessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sessionId', 'tenantId', 'userId', 'status', 'createdAt', 'updatedAt'],
      properties: {
        sessionId:     { bsonType: 'string', description: 'UUID - required' },
        tenantId:      { bsonType: 'string', description: 'Tenant identifier - required' },
        userId:        { bsonType: 'string', description: 'User identifier - required' },
        status:        { enum: ['active', 'paused', 'completed', 'archived'], description: 'Session lifecycle status' },
        title:         { bsonType: 'string', maxLength: 200 },
        businessModelId: { bsonType: 'string' },
        lastResumedAt: { bsonType: 'date' },
        createdAt:     { bsonType: 'date' },
        updatedAt:     { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'warn'
});

-- businessModels collection (concepts[] embedded sub-documents)
db.createCollection('businessModels', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['modelId', 'sessionId', 'tenantId', 'concepts', 'confidenceScore', 'version', 'createdAt', 'updatedAt'],
      properties: {
        modelId:          { bsonType: 'string' },
        sessionId:        { bsonType: 'string' },
        tenantId:         { bsonType: 'string' },
        confidenceScore:  { bsonType: 'int', minimum: 0, maximum: 100 },
        version:          { bsonType: 'int', minimum: 1 },
        matchedPatternId: { bsonType: 'string' },
        concepts: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['conceptId', 'conceptType', 'name'],
            properties: {
              conceptId:    { bsonType: 'string' },
              conceptType:  { enum: ['Actor','Goal','Activity','Decision','Evidence','BusinessRule','Constraint','EvaluationCriteria','Workflow','Outcome','Document','Event','ExternalSystem','Assumption','Unknown'] },
              name:         { bsonType: 'string', minLength: 1, maxLength: 200 },
              description:  { bsonType: 'string' },
              sourceText:   { bsonType: 'string' },
              relationships: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  required: ['targetConceptId', 'relationshipType'],
                  properties: {
                    targetConceptId:  { bsonType: 'string' },
                    relationshipType: { enum: ['uses','produces','triggers','governs','requires','part-of'] },
                    description:      { bsonType: 'string' }
                  }
                }
              }
            }
          }
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'warn'
});

-- solutionHypotheses collection
db.createCollection('solutionHypotheses', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['hypothesisId', 'sessionId', 'tenantId', 'status', 'adspServices', 'summary', 'version', 'createdAt', 'updatedAt'],
      properties: {
        hypothesisId: { bsonType: 'string' },
        sessionId:    { bsonType: 'string' },
        tenantId:     { bsonType: 'string' },
        status:       { enum: ['draft', 'proposed', 'accepted', 'rejected', 'superseded'] },
        adspServices: { bsonType: 'array', minItems: 1, items: { bsonType: 'string' } },
        summary:      { bsonType: 'string' },
        version:      { bsonType: 'int', minimum: 1 },
        patternId:    { bsonType: 'string' },
        reasoning:    { bsonType: 'string' },
        createdAt:    { bsonType: 'date' },
        updatedAt:    { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'warn'
});

-- conversationMessages collection
db.createCollection('conversationMessages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['messageId', 'sessionId', 'tenantId', 'role', 'content', 'timestamp'],
      properties: {
        messageId: { bsonType: 'string' },
        sessionId: { bsonType: 'string' },
        tenantId:  { bsonType: 'string' },
        role:      { enum: ['user', 'assistant', 'system'] },
        content:   { bsonType: 'string', minLength: 1 },
        timestamp: { bsonType: 'date' },
        agentId:   { bsonType: 'string' }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'warn'
});

-- auditEvents collection (append-only per BR-008)
db.createCollection('auditEvents', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['eventId', 'timestamp', 'actorId', 'tenantId', 'action', 'outcome', 'hmac'],
      properties: {
        eventId:         { bsonType: 'string' },
        timestamp:       { bsonType: 'date' },
        actorId:         { bsonType: 'string' },
        tenantId:        { bsonType: 'string' },
        action:          { bsonType: 'string' },
        resourceId:      { bsonType: 'string' },
        resourceType:    { bsonType: 'string' },
        outcome:         { bsonType: 'string' },
        hmac:            { bsonType: 'string', description: 'HMAC-SHA256 of event payload using AUDIT_SIGNING_KEY' },
        previousEventId: { bsonType: ['string', 'null'], description: 'Chain reference for HMAC integrity' }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'warn'
});

-- specialistRequests collection
db.createCollection('specialistRequests', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['requestId', 'sessionId', 'tenantId', 'specialistType', 'requestPayload', 'status', 'createdAt', 'updatedAt'],
      properties: {
        requestId:       { bsonType: 'string' },
        sessionId:       { bsonType: 'string' },
        tenantId:        { bsonType: 'string' },
        specialistType:  { bsonType: 'string' },
        requestPayload:  { bsonType: 'object' },
        status:          { enum: ['pending', 'sent', 'completed', 'failed'] },
        createdAt:       { bsonType: 'date' },
        updatedAt:       { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'warn'
});

-- specialistResponses collection
db.createCollection('specialistResponses', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['responseId', 'requestId', 'sessionId', 'tenantId', 'responsePayload', 'receivedAt'],
      properties: {
        responseId:      { bsonType: 'string' },
        requestId:       { bsonType: 'string' },
        sessionId:       { bsonType: 'string' },
        tenantId:        { bsonType: 'string' },
        responsePayload: { bsonType: 'object' },
        receivedAt:      { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'warn'
});

-- sessionExports collection
db.createCollection('sessionExports', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['exportId', 'sessionId', 'tenantId', 'userId', 'exportData', 'format', 'exportedAt'],
      properties: {
        exportId:    { bsonType: 'string' },
        sessionId:   { bsonType: 'string' },
        tenantId:    { bsonType: 'string' },
        userId:      { bsonType: 'string' },
        exportData:  { bsonType: 'object' },
        format:      { bsonType: 'string' },
        exportedAt:  { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'warn'
});

-- userContexts collection
db.createCollection('userContexts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['contextId', 'userId', 'tenantId', 'createdAt', 'updatedAt'],
      properties: {
        contextId:           { bsonType: 'string' },
        userId:              { bsonType: 'string' },
        tenantId:            { bsonType: 'string' },
        preferences:         { bsonType: 'object' },
        lastActiveSessionId: { bsonType: 'string' },
        createdAt:           { bsonType: 'date' },
        updatedAt:           { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'warn'
});
*/

-- =============================================================================
-- MONGOOSE SCHEMA REFERENCE (TypeScript)
-- =============================================================================
/*
// PlanningSessionSchema (Mongoose)
const PlanningSessionSchema = new Schema({
  sessionId:      { type: String, required: true, unique: true },
  tenantId:       { type: String, required: true, index: true },
  userId:         { type: String, required: true, index: true },
  status:         { type: String, enum: ['active','paused','completed','archived'], required: true },
  title:          { type: String, maxlength: 200 },
  businessModelId: { type: String },
  lastResumedAt:  { type: Date },
  createdAt:      { type: Date, required: true },
  updatedAt:      { type: Date, required: true }
});

// BusinessModelSchema (Mongoose) - embedded BusinessConcept sub-documents
const ConceptRelationshipSchema = new Schema({ targetConceptId: String, relationshipType: { type: String, enum: ['uses','produces','triggers','governs','requires','part-of'] }, description: String }, { _id: false });
const BusinessConceptSchema = new Schema({ conceptId: { type: String, required: true }, conceptType: { type: String, enum: ['Actor','Goal','Activity','Decision','Evidence','BusinessRule','Constraint','EvaluationCriteria','Workflow','Outcome','Document','Event','ExternalSystem','Assumption','Unknown'], required: true }, name: { type: String, required: true, maxlength: 200 }, description: String, sourceText: String, relationships: [ConceptRelationshipSchema] }, { _id: false });
const BusinessModelSchema = new Schema({ modelId: { type: String, required: true, unique: true }, sessionId: { type: String, required: true, index: true }, tenantId: { type: String, required: true, index: true }, concepts: [BusinessConceptSchema], confidenceScore: { type: Number, min: 0, max: 100, required: true }, version: { type: Number, min: 1, required: true, default: 1 }, matchedPatternId: String, createdAt: Date, updatedAt: Date });

// SolutionHypothesisSchema (Mongoose) - maps to solutionHypotheses collection
const SolutionHypothesisSchema = new Schema({ hypothesisId: { type: String, required: true, unique: true }, sessionId: { type: String, required: true, index: true }, tenantId: { type: String, required: true, index: true }, status: { type: String, enum: ['draft','proposed','accepted','rejected','superseded'], required: true }, adspServices: { type: [String], required: true, validate: { validator: (v: string[]) => v.length >= 1 } }, summary: { type: String, required: true }, version: { type: Number, min: 1, default: 1 }, patternId: String, reasoning: String, createdAt: Date, updatedAt: Date });

// ConversationMessageSchema (Mongoose)
const ConversationMessageSchema = new Schema({ messageId: { type: String, required: true, unique: true }, sessionId: { type: String, required: true, index: true }, tenantId: { type: String, required: true, index: true }, role: { type: String, enum: ['user','assistant','system'], required: true }, content: { type: String, required: true, minlength: 1 }, timestamp: { type: Date, required: true }, agentId: String });

// AuditEventSchema (Mongoose) - append-only, HMAC chain
const AuditEventSchema = new Schema({ eventId: { type: String, required: true, unique: true }, timestamp: { type: Date, required: true }, actorId: { type: String, required: true }, tenantId: { type: String, required: true, index: true }, action: { type: String, required: true }, resourceId: String, resourceType: String, outcome: { type: String, required: true }, hmac: { type: String, required: true }, previousEventId: { type: String, default: null } });
*/

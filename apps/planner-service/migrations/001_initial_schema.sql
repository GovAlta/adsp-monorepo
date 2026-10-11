-- 001_initial_schema.sql
-- Initial schema migration for planner-service (MongoDB-primary; SQL DDL for schema validation)
-- All tables correspond to Stage 3 DDL: planning_session, business_model, business_concept,
-- concept_relationship, hypothesis_record, conversation_message, audit_event,
-- specialist_request, specialist_response, session_export, user_context

-- This migration is the canonical reference for MongoDB collection naming conventions.
-- Actual persistence is via Mongoose ODM; these DDL statements document the data contract.

-- planning_session: BR-001 tenant isolation, BR-010 status machine
CREATE TABLE IF NOT EXISTS planning_session (
  session_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  title VARCHAR(200),
  business_model_id VARCHAR(36),
  last_resumed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT pk_planning_session PRIMARY KEY (session_id),
  CONSTRAINT ck_planning_session_status CHECK (status IN ('active','paused','completed','archived'))
);

-- business_model: BR-004 confidence score ≥ 70 before hypothesis creation
CREATE TABLE IF NOT EXISTS business_model (
  model_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  confidence_score INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  matched_pattern_id VARCHAR(36),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT pk_business_model PRIMARY KEY (model_id),
  CONSTRAINT fk_business_model_session FOREIGN KEY (session_id) REFERENCES planning_session(session_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- business_concept: BR-006 conceptType enum
CREATE TABLE IF NOT EXISTS business_concept (
  concept_id VARCHAR(36) NOT NULL,
  model_id VARCHAR(36) NOT NULL,
  concept_type VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  source_text TEXT,
  CONSTRAINT pk_business_concept PRIMARY KEY (concept_id),
  CONSTRAINT ck_business_concept_type CHECK (concept_type IN ('Actor','Goal','Activity','Decision','Evidence','BusinessRule','Constraint','EvaluationCriteria','Workflow','Outcome','Document','Event','ExternalSystem','Assumption','Unknown'))
);

-- concept_relationship
CREATE TABLE IF NOT EXISTS concept_relationship (
  relationship_id VARCHAR(36) NOT NULL,
  source_concept_id VARCHAR(36) NOT NULL,
  target_concept_id VARCHAR(36) NOT NULL,
  relationship_type VARCHAR(50) NOT NULL,
  CONSTRAINT pk_concept_relationship PRIMARY KEY (relationship_id),
  CONSTRAINT ck_concept_rel_type CHECK (relationship_type IN ('uses','produces','triggers','governs','requires','part-of'))
);

-- hypothesis_record: BR-010 status machine
CREATE TABLE IF NOT EXISTS hypothesis_record (
  hypothesis_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  summary TEXT,
  reasoning TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT pk_hypothesis_record PRIMARY KEY (hypothesis_id),
  CONSTRAINT ck_hypothesis_record_status CHECK (status IN ('draft','proposed','accepted','rejected','superseded')),
  CONSTRAINT fk_hypothesis_session FOREIGN KEY (session_id) REFERENCES planning_session(session_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- conversation_message: Protected B content (ATIA s.23)
CREATE TABLE IF NOT EXISTS conversation_message (
  message_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT pk_conversation_message PRIMARY KEY (message_id),
  CONSTRAINT ck_conversation_message_role CHECK (role IN ('user','assistant','system')),
  CONSTRAINT fk_message_session FOREIGN KEY (session_id) REFERENCES planning_session(session_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- audit_event: BR-008 append-only, HMAC-chained (SYSREQ-020)
CREATE TABLE IF NOT EXISTS audit_event (
  event_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(36),
  previous_event_id VARCHAR(36),
  hmac VARCHAR(64) NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  CONSTRAINT pk_audit_event PRIMARY KEY (event_id)
);

-- specialist_request: SYSREQ-007
CREATE TABLE IF NOT EXISTS specialist_request (
  request_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  specialist_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT pk_specialist_request PRIMARY KEY (request_id),
  CONSTRAINT ck_specialist_request_status CHECK (status IN ('pending','sent','completed','failed')),
  CONSTRAINT fk_specialist_req_session FOREIGN KEY (session_id) REFERENCES planning_session(session_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- specialist_response: SYSREQ-007
CREATE TABLE IF NOT EXISTS specialist_response (
  response_id VARCHAR(36) NOT NULL,
  request_id VARCHAR(36) NOT NULL,
  content TEXT,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT pk_specialist_response PRIMARY KEY (response_id),
  CONSTRAINT fk_specialist_resp_req FOREIGN KEY (request_id) REFERENCES specialist_request(request_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- session_export: SYSREQ-016
CREATE TABLE IF NOT EXISTS session_export (
  export_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  format VARCHAR(20) NOT NULL,
  exported_at TIMESTAMP NOT NULL,
  CONSTRAINT pk_session_export PRIMARY KEY (export_id),
  CONSTRAINT fk_session_export_session FOREIGN KEY (session_id) REFERENCES planning_session(session_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- user_context: INT-008 Keycloak multi-tenant JWT
CREATE TABLE IF NOT EXISTS user_context (
  context_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  preferences JSONB,
  last_active_session_id VARCHAR(36),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT pk_user_context PRIMARY KEY (context_id),
  CONSTRAINT uq_user_context_user_tenant UNIQUE (user_id, tenant_id)
);

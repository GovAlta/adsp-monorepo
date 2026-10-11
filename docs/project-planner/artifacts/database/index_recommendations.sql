-- =============================================================================
-- planner-service Index Recommendations
-- =============================================================================
-- DATABASE: MongoDB (document store)
-- ADAPTATION NOTE: SQL CREATE INDEX statements below are the canonical
--   validator-compatible index definitions. Operators MUST use the
--   db.collection.createIndex() commands in the MongoDB Reference section
--   for actual deployment.
--
-- INDEX NAMING CONVENTION: ix_<table>_<field(s)> (ISO/IEC 11179 adapted)
-- MULTI-TENANT REQUIREMENT: tenantId MUST be indexed on every collection
--   per SYSREQ-010. Compound indexes include tenantId as leading key where
--   multi-tenant partitioning is the primary query pattern.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- planning_session indexes
-- Supports: session lookup by tenant, user, status filtering
-- SYSREQ-005 (session persistence), SYSREQ-010 (tenant isolation),
-- BR-003 (30-day idle TTL queries on updated_at)
-- -----------------------------------------------------------------------------
CREATE INDEX ix_planning_session_tenant_id ON planning_session (tenant_id);
CREATE INDEX ix_planning_session_user_id ON planning_session (user_id);
CREATE INDEX ix_planning_session_tenant_user ON planning_session (tenant_id, user_id);
CREATE INDEX ix_planning_session_updated_at ON planning_session (updated_at);
CREATE INDEX ix_planning_session_status ON planning_session (status);

-- -----------------------------------------------------------------------------
-- business_model indexes
-- Supports: model lookup by session (FK join), tenant filtering
-- SYSREQ-002 (incremental model construction), SWREQ-003 (Mongoose queries)
-- -----------------------------------------------------------------------------
CREATE INDEX ix_business_model_session_id ON business_model (session_id);
CREATE INDEX ix_business_model_tenant_id ON business_model (tenant_id);

-- -----------------------------------------------------------------------------
-- business_concept indexes
-- Supports: concept lookup by model (FK join), type filtering
-- BR-006 (conceptType queries)
-- -----------------------------------------------------------------------------
CREATE INDEX ix_business_concept_model_id ON business_concept (model_id);
CREATE INDEX ix_business_concept_type ON business_concept (concept_type);

-- -----------------------------------------------------------------------------
-- concept_relationship indexes
-- Supports: relationship traversal by source concept (FK join)
-- -----------------------------------------------------------------------------
CREATE INDEX ix_concept_relationship_source ON concept_relationship (source_concept_id);
CREATE INDEX ix_concept_relationship_target ON concept_relationship (target_concept_id);

-- -----------------------------------------------------------------------------
-- hypothesis_record indexes
-- Supports: hypothesis lookup by session, tenant, status (state queries)
-- SYSREQ-004 (hypothesis generation), BR-010 (status transitions)
-- -----------------------------------------------------------------------------
CREATE INDEX ix_hypothesis_record_session_id ON hypothesis_record (session_id);
CREATE INDEX ix_hypothesis_record_tenant_id ON hypothesis_record (tenant_id);
CREATE INDEX ix_hypothesis_record_status ON hypothesis_record (status);

-- -----------------------------------------------------------------------------
-- conversation_message indexes
-- Supports: message lookup by session (ordered by timestamp for history),
-- tenant filtering; append-only conversation per SYSREQ-005
-- -----------------------------------------------------------------------------
CREATE INDEX ix_conversation_message_session_id ON conversation_message (session_id);
CREATE INDEX ix_conversation_message_tenant_id ON conversation_message (tenant_id);
CREATE INDEX ix_conversation_message_session_ts ON conversation_message (session_id, timestamp);

-- -----------------------------------------------------------------------------
-- audit_event indexes
-- Supports: audit log queries by tenant + time range; HMAC chain traversal
-- SYSREQ-020 (HMAC audit logging), SWREQ-013 (audit middleware)
-- NOTE: TTL index on timestamp for MongoDB (30-day audit retention per SYSREQ-022)
-- -----------------------------------------------------------------------------
CREATE INDEX ix_audit_event_tenant_id ON audit_event (tenant_id);
CREATE INDEX ix_audit_event_timestamp ON audit_event (timestamp);
CREATE INDEX ix_audit_event_tenant_ts ON audit_event (tenant_id, timestamp);

-- -----------------------------------------------------------------------------
-- specialist_request indexes
-- Supports: request lookup by session, status filtering
-- SYSREQ-007 (specialist agent invocation tracking)
-- -----------------------------------------------------------------------------
CREATE INDEX ix_specialist_request_session_id ON specialist_request (session_id);
CREATE INDEX ix_specialist_request_tenant_id ON specialist_request (tenant_id);
CREATE INDEX ix_specialist_request_status ON specialist_request (status);

-- -----------------------------------------------------------------------------
-- specialist_response indexes
-- Supports: response lookup by request (FK join), session filtering
-- SYSREQ-007 (specialist response storage)
-- -----------------------------------------------------------------------------
CREATE INDEX ix_specialist_response_request_id ON specialist_response (request_id);
CREATE INDEX ix_specialist_response_session_id ON specialist_response (session_id);
CREATE INDEX ix_specialist_response_tenant_id ON specialist_response (tenant_id);

-- -----------------------------------------------------------------------------
-- session_export indexes
-- Supports: export lookup by session, tenant, user
-- SYSREQ-016 (session export)
-- -----------------------------------------------------------------------------
CREATE INDEX ix_session_export_session_id ON session_export (session_id);
CREATE INDEX ix_session_export_tenant_id ON session_export (tenant_id);
CREATE INDEX ix_session_export_user_id ON session_export (user_id);

-- -----------------------------------------------------------------------------
-- user_context indexes
-- Supports: context lookup by user+tenant (unique compound already indexed),
-- individual tenant queries
-- uq_user_context_user_tenant provides implicit compound index coverage
-- -----------------------------------------------------------------------------
CREATE INDEX ix_user_context_tenant_id ON user_context (tenant_id);
CREATE INDEX ix_user_context_user_id ON user_context (user_id);

-- =============================================================================
-- MONGODB REFERENCE - db.collection.createIndex() commands
-- Run during provisioning against the MongoDB instance
-- =============================================================================
/*
// planningSessions
db.planningSessions.createIndex({ tenantId: 1 }, { name: 'ix_planning_session_tenant_id' });
db.planningSessions.createIndex({ userId: 1 }, { name: 'ix_planning_session_user_id' });
db.planningSessions.createIndex({ tenantId: 1, userId: 1 }, { name: 'ix_planning_session_tenant_user' });
db.planningSessions.createIndex({ updatedAt: 1 }, { name: 'ix_planning_session_updated_at', expireAfterSeconds: 2592000 }); // 30-day TTL per BR-003
db.planningSessions.createIndex({ status: 1 }, { name: 'ix_planning_session_status' });
db.planningSessions.createIndex({ sessionId: 1 }, { name: 'ix_planning_session_id', unique: true });

// businessModels
db.businessModels.createIndex({ sessionId: 1 }, { name: 'ix_business_model_session_id' });
db.businessModels.createIndex({ tenantId: 1 }, { name: 'ix_business_model_tenant_id' });
db.businessModels.createIndex({ modelId: 1 }, { name: 'ix_business_model_id', unique: true });

// solutionHypotheses
db.solutionHypotheses.createIndex({ sessionId: 1 }, { name: 'ix_hypothesis_record_session_id' });
db.solutionHypotheses.createIndex({ tenantId: 1 }, { name: 'ix_hypothesis_record_tenant_id' });
db.solutionHypotheses.createIndex({ status: 1 }, { name: 'ix_hypothesis_record_status' });
db.solutionHypotheses.createIndex({ hypothesisId: 1 }, { name: 'ix_hypothesis_id', unique: true });

// conversationMessages
db.conversationMessages.createIndex({ sessionId: 1 }, { name: 'ix_conversation_message_session_id' });
db.conversationMessages.createIndex({ tenantId: 1 }, { name: 'ix_conversation_message_tenant_id' });
db.conversationMessages.createIndex({ sessionId: 1, timestamp: 1 }, { name: 'ix_conversation_message_session_ts' });
db.conversationMessages.createIndex({ messageId: 1 }, { name: 'ix_message_id', unique: true });

// auditEvents
db.auditEvents.createIndex({ tenantId: 1 }, { name: 'ix_audit_event_tenant_id' });
db.auditEvents.createIndex({ timestamp: 1 }, { name: 'ix_audit_event_timestamp' });
db.auditEvents.createIndex({ tenantId: 1, timestamp: 1 }, { name: 'ix_audit_event_tenant_ts' });
db.auditEvents.createIndex({ eventId: 1 }, { name: 'ix_audit_event_id', unique: true });

// specialistRequests
db.specialistRequests.createIndex({ sessionId: 1 }, { name: 'ix_specialist_request_session_id' });
db.specialistRequests.createIndex({ tenantId: 1 }, { name: 'ix_specialist_request_tenant_id' });
db.specialistRequests.createIndex({ status: 1 }, { name: 'ix_specialist_request_status' });

// specialistResponses
db.specialistResponses.createIndex({ requestId: 1 }, { name: 'ix_specialist_response_request_id' });
db.specialistResponses.createIndex({ sessionId: 1 }, { name: 'ix_specialist_response_session_id' });
db.specialistResponses.createIndex({ tenantId: 1 }, { name: 'ix_specialist_response_tenant_id' });

// sessionExports
db.sessionExports.createIndex({ sessionId: 1 }, { name: 'ix_session_export_session_id' });
db.sessionExports.createIndex({ tenantId: 1 }, { name: 'ix_session_export_tenant_id' });
db.sessionExports.createIndex({ userId: 1 }, { name: 'ix_session_export_user_id' });

// userContexts
db.userContexts.createIndex({ tenantId: 1 }, { name: 'ix_user_context_tenant_id' });
db.userContexts.createIndex({ userId: 1 }, { name: 'ix_user_context_user_id' });
db.userContexts.createIndex({ userId: 1, tenantId: 1 }, { name: 'uq_user_context_user_tenant', unique: true });
*/

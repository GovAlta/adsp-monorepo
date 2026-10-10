import { BusinessPattern, Signal } from './types';

const sig = (description: string, ...keywords: string[]): Signal => ({ description, keywords });

const CASE_MANAGEMENT: BusinessPattern = {
  id: 'case-management',
  name: 'Case Management',
  description:
    'Manage records moving through a lifecycle and being handled collaboratively by staff over time (collaboration, tasks, notes, files, status tracking, audit history).',
  domainLanguage: [
    'case',
    'request',
    'application',
    'dispute',
    'incident',
    'investigation',
    'claim',
    'review',
    'approval',
    'intake',
    'workflow',
    'escalation',
    'assignment',
  ],
  strongSignals: [
    sig('Long-lived records or cases', 'case', 'long-lived', 'lifecycle', 'ongoing'),
    sig('Human workflow or review steps', 'review', 'approve', 'approval', 'adjudicate'),
    sig('Status transitions', 'status', 'under review', 'moves through', 'stages'),
    sig('Notes, comments, or attachments', 'notes', 'comments', 'attachments'),
    sig('Task assignment or escalation', 'assign', 'assigned', 'escalate', 'escalation'),
    sig('Audit history', 'audit', 'history'),
    sig('Search/filter/reporting of active cases', 'active cases', 'caseload', 'case list'),
  ],
  weakSignals: [
    sig('A form is submitted by a user', 'form', 'submit'),
    sig('Users receive notifications', 'notification', 'notify', 'email'),
    sig('Files or documents are uploaded', 'upload'),
    sig('Reports are generated', 'report'),
  ],
  serviceMappings: [
    { service: 'form-service', reason: 'Intake forms and data collection.' },
    { service: 'comment-service', reason: 'Staff notes, discussions, and case history.' },
    { service: 'file-service', reason: 'Supporting documents and attachments.' },
    { service: 'notification-service', reason: 'Status updates and requests for additional information.' },
    { service: 'value-service', reason: 'Storage of case-specific business data.' },
    { service: 'configuration-service', reason: 'Workflow definitions, status values, and configurable rules.' },
    { service: 'task-service', reason: 'Assignment of work to staff queues when formal task management is needed.' },
  ],
  clarifyingQuestions: [
    'Does the submission become a long-lived record after intake?',
    'Will staff review, approve, reject, or request changes?',
    'Does the record move through multiple statuses over time?',
    'Are multiple staff members expected to collaborate on the same record?',
    'Are comments, notes, or attachments required?',
    'Will work be assigned to specific individuals or teams?',
    'Is an audit history required?',
    'Will users return to view status updates or provide additional information?',
    'Does the process include escalation, review, or approval steps?',
  ],
  assumptions: [
    'Records persist beyond initial submission.',
    'The process involves one or more human review steps.',
    'Records move through a defined lifecycle.',
    'Multiple user roles interact with the same record.',
    'Historical actions and decisions may need to be retained.',
  ],
  knownUnknowns: [
    'Workflow complexity may vary significantly between implementations.',
    'Some solutions require formal task management while others do not.',
    'Some solutions may require external integrations or document management.',
    'Security, privacy, and retention requirements are domain-specific and must be validated in discovery.',
  ],
};

interface PatternSeed {
  id: string;
  name: string;
  description: string;
  language: string[];
  strong: string[];
  services: [string, string][];
  questions: string[];
}

const seed = (s: PatternSeed): BusinessPattern => ({
  id: s.id,
  name: s.name,
  description: s.description,
  domainLanguage: s.language,
  strongSignals: s.strong.map((k) => sig(k, ...k.toLowerCase().split(/[,/]\s*/))),
  weakSignals: [sig('A form is submitted by a user', 'form', 'submit'), sig('Users receive notifications', 'notify')],
  serviceMappings: s.services.map(([service, reason]) => ({ service, reason })),
  clarifyingQuestions: s.questions,
  assumptions: ['Details of this pattern are a starting hypothesis and must be confirmed with the user.'],
  knownUnknowns: ['Security, privacy, and retention requirements are domain-specific and must be validated.'],
});

const FORM = ['form-service', 'Intake forms and data collection.'] as [string, string];
const NOTIFY = ['notification-service', 'Notify participants of status changes.'] as [string, string];
const FILE = ['file-service', 'Supporting documents and attachments.'] as [string, string];
const TASK = ['task-service', 'Assign review work to staff queues.'] as [string, string];
const VALUE = ['value-service', 'Store business data and metrics.'] as [string, string];
const CONFIG = ['configuration-service', 'Configurable rules and status values.'] as [string, string];
const COMMENT = ['comment-service', 'Notes and discussion.'] as [string, string];
const PDF = ['pdf-service', 'Generate PDF documents.'] as [string, string];
const CALENDAR = ['calendar-service', 'Scheduling of events and appointments.'] as [string, string];
const STATUS = ['status-service', 'Publish status to applicants and the public.'] as [string, string];

export const BUILT_IN_PATTERNS: BusinessPattern[] = [
  CASE_MANAGEMENT,
  seed({
    id: 'grant-applications',
    name: 'Grant Applications',
    description: 'Accept, review, approve, monitor, and track funding applications.',
    language: ['grant', 'funding', 'applicant', 'reviewer', 'adjudication', 'budget', 'program', 'payment'],
    strong: ['funding application', 'reviewer scoring', 'approval of funding', 'grant', 'monitoring of funded projects'],
    services: [FORM, FILE, TASK, NOTIFY, VALUE, PDF],
    questions: [
      'Who are the applicants and reviewers?',
      'Is there a scoring or eligibility rubric?',
      'Are funds monitored after approval?',
    ],
  }),
  seed({
    id: 'permit-licence',
    name: 'Permit / licence application',
    description: 'Apply, review, approve, renew, suspend, expire.',
    language: ['permit', 'licence', 'license', 'renewal', 'expiry', 'suspend', 'issue', 'certificate'],
    strong: ['permit', 'licence', 'license', 'renew', 'expire'],
    services: [FORM, FILE, TASK, NOTIFY, PDF, CALENDAR],
    questions: ['Does the licence expire and renew?', 'Is a certificate or document issued?'],
  }),
  seed({
    id: 'registration-enrollment',
    name: 'Registration / enrollment',
    description: 'Register a person, organization, facility, program, asset, or activity.',
    language: ['register', 'registration', 'enroll', 'enrollment', 'registry', 'facility', 'organization'],
    strong: ['register', 'registration', 'enroll', 'registry'],
    services: [FORM, VALUE, NOTIFY, FILE],
    questions: ['What is being registered?', 'Do registrations need renewal or approval?'],
  }),
  seed({
    id: 'inspection-compliance',
    name: 'Inspection / compliance',
    description: 'Schedule inspection, record findings, issue actions, track remediation.',
    language: ['inspection', 'inspector', 'compliance', 'finding', 'remediation', 'violation', 'audit'],
    strong: ['inspection', 'finding', 'remediation', 'compliance', 'violation'],
    services: [FORM, CALENDAR, TASK, FILE, NOTIFY, PDF],
    questions: ['Are inspections scheduled?', 'Are findings tracked until remediated?'],
  }),
  seed({
    id: 'complaint-intake',
    name: 'Complaint / concern intake',
    description: 'Receive complaint, triage, assign, investigate, respond.',
    language: ['complaint', 'concern', 'triage', 'investigate', 'respond', 'grievance'],
    strong: ['complaint', 'concern', 'triage', 'grievance'],
    services: [FORM, TASK, COMMENT, NOTIFY, FILE],
    questions: ['Is anonymity needed?', 'How are complaints triaged and assigned?'],
  }),
  seed({
    id: 'consultation-feedback',
    name: 'Consultation / feedback collection',
    description: 'Gather stakeholder or public feedback, summarize themes, report outcomes.',
    language: ['consultation', 'feedback', 'survey', 'stakeholder', 'engagement', 'themes'],
    strong: ['consultation', 'feedback', 'survey', 'stakeholder engagement'],
    services: [FORM, ['feedback-service', 'Collect user feedback.'], VALUE, NOTIFY],
    questions: ['Is the feedback public or targeted?', 'How will results be summarized?'],
  }),
  seed({
    id: 'eligibility-assessment',
    name: 'Benefit / eligibility assessment',
    description: 'Determine whether someone qualifies for a program or service.',
    language: ['eligibility', 'eligible', 'qualify', 'benefit', 'entitlement', 'assessment'],
    strong: ['eligibility', 'qualify', 'benefit', 'entitlement'],
    services: [FORM, CONFIG, VALUE, NOTIFY],
    questions: ['Where do eligibility rules live?', 'Is the determination automatic or reviewed by staff?'],
  }),
  seed({
    id: 'appointment-booking',
    name: 'Appointment / booking request',
    description: 'Request, schedule, confirm, reschedule, notify.',
    language: ['appointment', 'booking', 'book', 'schedule', 'reschedule', 'slot', 'reservation'],
    strong: ['appointment', 'booking', 'reschedule', 'slot'],
    services: [CALENDAR, FORM, NOTIFY],
    questions: ['Who owns the calendars?', 'Are reminders needed?'],
  }),
  seed({
    id: 'document-package-review',
    name: 'Document submission / package review',
    description: 'Upload required files, validate completeness, review, request changes.',
    language: ['package', 'submission', 'document', 'completeness', 'upload', 'changes requested'],
    strong: ['completeness', 'document package', 'request changes', 'required documents'],
    services: [FILE, FORM, TASK, COMMENT, NOTIFY],
    questions: ['Which documents are required?', 'Who validates completeness?'],
  }),
  seed({
    id: 'incident-reporting',
    name: 'Incident / emergency response reporting',
    description: 'Capture event details, coordinate response, log actions.',
    language: ['incident', 'emergency', 'response', 'coordinate', 'report incident', 'log actions'],
    strong: ['incident', 'emergency', 'response coordination'],
    services: [FORM, TASK, NOTIFY, COMMENT, ['event-service', 'Record and route response events.']],
    questions: ['Is the response time-critical?', 'Who is notified on a new incident?'],
  }),
  seed({
    id: 'information-request',
    name: 'Information request / FOIP-style request',
    description: 'Intake request, assign analyst, gather records, respond.',
    language: ['foip', 'information request', 'access request', 'records', 'analyst', 'disclosure'],
    strong: ['foip', 'information request', 'access to information', 'records search'],
    services: [FORM, TASK, FILE, COMMENT, PDF, NOTIFY],
    questions: ['Are there statutory deadlines?', 'Are records redacted before release?'],
  }),
  seed({
    id: 'referral-routing',
    name: 'Referral / routing workflow',
    description: 'Send a request to the right ministry/team/program based on rules.',
    language: ['referral', 'routing', 'route', 'redirect', 'ministry', 'program', 'rules'],
    strong: ['referral', 'routing', 'route to the right'],
    services: [FORM, CONFIG, TASK, NOTIFY],
    questions: ['What rules determine the destination?', 'Can routing change over time?'],
  }),
  seed({
    id: 'status-tracking-portal',
    name: 'Status tracking portal',
    description: 'Let applicants or clients see where their request is in the process.',
    language: ['status', 'track', 'portal', 'progress', 'where is my', 'applicant view'],
    strong: ['status tracking', 'track my', 'where is my', 'progress of'],
    services: [STATUS, VALUE, NOTIFY],
    questions: ['Who can see status?', 'Is authentication required?'],
  }),
  seed({
    id: 'audit-evidence-trail',
    name: 'Audit / evidence trail',
    description: 'Record who did what, when, and why.',
    language: ['audit', 'trail', 'evidence', 'who did what', 'traceability', 'accountability'],
    strong: ['audit trail', 'evidence trail', 'who did what', 'traceability'],
    services: [['event-service', 'Event log of actions with context.'], VALUE],
    questions: ['How long must records be retained?', 'Who reviews the audit trail?'],
  }),
  seed({
    id: 'public-reporting',
    name: 'Public reporting / data collection',
    description: 'Collect recurring reports from municipalities, agencies, operators, etc.',
    language: ['recurring report', 'quarterly', 'annual report', 'municipality', 'operator', 'submission period'],
    strong: ['recurring report', 'quarterly report', 'annual report', 'data collection'],
    services: [FORM, VALUE, NOTIFY, CALENDAR],
    questions: ['What is the reporting cadence?', 'Who consumes the aggregated data?'],
  }),
  seed({
    id: 'document-generation',
    name: 'Template-driven document generation',
    description: 'Generate letters, certificates, summaries, notices, decision documents.',
    language: ['letter', 'certificate', 'notice', 'template', 'generate document', 'decision letter'],
    strong: ['generate letter', 'certificate', 'decision document', 'template'],
    services: [PDF, FILE, VALUE],
    questions: ['Which data populates the templates?', 'Who approves generated documents?'],
  }),
  seed({
    id: 'notification-subscription',
    name: 'Notification campaign / subscription',
    description: 'Let users subscribe to updates, send alerts, reminders, announcements.',
    language: ['subscribe', 'subscription', 'alert', 'reminder', 'announcement', 'campaign', 'newsletter'],
    strong: ['subscribe', 'subscription', 'announcement', 'alerts'],
    services: [NOTIFY, ['push-service', 'Real-time updates to connected clients.'], CONFIG],
    questions: ['Which channels are required?', 'How do users manage subscriptions?'],
  }),
  seed({
    id: 'internal-service-request',
    name: 'Internal service request',
    description: 'Request support from a shared service team: forms, IT, comms, legal, procurement.',
    language: ['internal request', 'shared service', 'support request', 'it request', 'procurement', 'service desk'],
    strong: ['shared service', 'service desk', 'support request', 'internal request'],
    services: [FORM, TASK, NOTIFY, COMMENT],
    questions: ['Which shared team fulfils requests?', 'Are there service-level targets?'],
  }),
];

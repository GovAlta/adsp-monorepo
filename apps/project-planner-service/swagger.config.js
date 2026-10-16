module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Project planner service',
    version: '0.0.0',
    description: `The Project Planner Service helps people who are new to ADSP describe a business problem and
turn it into a plan for using ADSP services.

The planner builds a structured _business model_ of the problem (actors, goals, workflows, rules, constraints,
assumptions, unknowns, etc.), matches it against known GoA _business patterns_, and derives one or more
_solution hypotheses_ that recommend ADSP services. Each recommended service has a _specialist_ that can be consulted
for service-specific questions and dependencies, and the user can be handed off to a service workspace with the
solution context.

A _solution_ is the persistent, structured state of this work: decisions made (and why), open questions,
specialist progress, artifacts, and recommended next steps. It survives across sessions so the user does not need
to repeat information already gathered.

Any recommendation made by the planner is a hypothesis for the user to refine.
`,
  },
  tags: [
    { name: 'Solution', description: 'Managing solutions and the planner workflow' },
    { name: 'Pattern', description: 'Business patterns known to the planner' },
    { name: 'Specialist', description: 'Service specialists the planner consults' },
  ],
  components: {
    securitySchemes: {
      accessToken: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ accessToken: [] }],
};

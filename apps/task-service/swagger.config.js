module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Task service',
    version: '0.0.0',
    description: `The Task Service gives applications a means for defining and managing tasks, and managing work assignments.
A task is a _unit of work_ that is assigned to an individual for completion by a certain date.  Exactly what the unit of work is
depends on the feature the application is trying to implement, but can be such things as:
- response required,
- signature required,
- actions to be completed,
- etc.

You can combine tasks into  a _queue_ of work units that represents:
- a specific job to be completed by one or more individuals,
- an individual's daily workload,
- reminders for a user,
- etc.

Queues are further organized into namespaces, which allows applications to keep tasks and queues separated by things like projects,
applications, or features.`,
  },
  tags: [
    { name: 'Queue', description: 'Managing Task Queues' },
    { name: 'Task', description: 'Managing Tasks' },
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

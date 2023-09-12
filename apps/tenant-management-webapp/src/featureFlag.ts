const completeServiceVariables = [
  {
    name: 'Access',
    link: '/admin/access',
    description:
      "Access allows you to add a secure sign in to your application and services with minimum effort and configuration. No need to deal with storing or authenticating users. It's all available out of the box",
    beta: false,
  },
  {
    name: 'Calendar',
    link: '/admin/services/calendar',
    description:
      'The calendar service provides information about dates, a model of calendars, calendar events and scheduling. This service manages dates and times in a particular timezone (America/Edmonton) rather than UTC or a particular UTC offset.',
    beta: true,
  },
  {
    name: 'Comment',
    link: '/admin/services/comment',
    description:
      'Comment services allows users to create topics and post comments against the topics. Topics are of a particular topic type, and the type determines the roles permitted to administer, read, or comment on a topic.',
    beta: true,
  },
  {
    name: 'Configuration',
    link: '/admin/services/configuration',
    description:
      'The configuration service provides a generic json document store for storage and revisioning of infrequently changing configuration. Store configuration against namespace and name keys, and optionally define configuration schemas for write validation.',
    beta: false,
  },
  {
    name: 'Directory',
    link: '/admin/services/directory',
    description:
      'The directory service is a registry of services and their APIs. Applications can use the directory to lookup URLs for service from a common directory API. Add entries for your own services so they can be found using the directory for service discovery.',
    beta: false,
  },
  {
    name: 'Event',
    link: '/admin/services/event',
    description:
      'The event service provides tenant applications with the ability to send domain events. Applications are able to leverage additional capabilities as side effects through these events.',
    beta: false,
  },
  {
    name: 'File',
    link: '/admin/services/file',
    description:
      'The file service provides the capability to upload and download files. Consumers are registered with their own space (tenant) containing file types that include role based access policy, and can associate files to domain records.',
    beta: false,
  },
  {
    name: 'Form',
    link: '/admin/services/form',
    description:
      'The form service provides capabilities to support user form submission. Form definitions are used to describe types of form with roles for applicants, clerks who assist them, and assessors who process the submissions.',
    beta: true,
  },
  {
    name: 'Notification',
    link: '/admin/services/notification',
    description: 'The notifications service provides tenant applications with the ability to configure notifications.',
    beta: false,
  },
  {
    name: 'PDF',
    link: '/admin/services/pdf',
    description:
      'The PDF service provides PDF operations like generating new PDFs from templates. It runs operations as asynchronous jobs and uploads the output PDF files to the file service.',
    beta: false,
  },
  {
    name: 'Script',
    link: '/admin/services/script',
    description:
      'The script services provides the ability to execute configured Lua scripts. Applications can use this to capture simple logic in configuration. For example, benefits calculations can be configured in a script and executed via the script service API so that policy changes to the formula can implemented through configuration change.',
    beta: true,
  },
  {
    name: 'Status',
    link: '/admin/services/status',
    description:
      'The status service allows for easy monitoring of application downtime. Each application should represent a service that is useful to the end user by itself, such as child care subsidy and child care certification.',
    beta: false,
  },
  {
    name: 'Task',
    link: '/admin/services/task',
    description:
      'The task service provides a model for tasks, task queues, and task assignment. Applications can use the task service for work management as an aspect to augment domain specific concepts and processes..',
    beta: true,
  },
];

export const defaultFeaturesVisible = {
  Access: true,
  Calendar: true,
  Comment: true,
  Configuration: true,
  Form: false,
  Directory: true,
  Event: true,
  File: true,
  Notification: true,
  PDF: true,
  Script: true,
  Status: true,
  Task: true,
};

export const serviceVariables = (featuresVisible = defaultFeaturesVisible) => {
  return completeServiceVariables.filter((adminF) => {
    return !(Object.keys(featuresVisible).includes(adminF.name) && featuresVisible[adminF.name] === false);
  });
};

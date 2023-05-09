module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Calendar service',
    version: '0.0.0',
    description: `## Calendar Events

The _Calendar Service_ is a set of API's that gives developers a means to create and manage
time based events for general use in calendars.  An event is defined by:

- a name,
- a description,
- a start time,
- an end time,
- an indication of whether or not it's a public event.
- an indication of whether or not it's an all day event.

Events can also be associated with a list of attendees, with each attendee defined by

- a name,
- an email address

## Special Dates

The service also includes an API you can use to populate a calendar with special dates, so that you can display them on your calendars.
Any date returned by the API will indicate whether or not;

- it's a weekend,
- it's a holiday,
- it's a business day,
- it's an in-lieu day

You can retrieve the information for a specific date, or all dates between a min and a max.
`,
  },
  tags: [],
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

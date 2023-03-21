module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'PDF Service',
    version: '0.0.0',
    description: `The **PDF Service** allows applications to create custom PDF documents for their end users to download and use. The service itself has two components:
1. A template editor, and
2. APIs to combine a template with data in order to generate a customized, downloadable PDF.

Authoring a template is done through the [PDF Service Webapp](https://adsp.alberta.ca/admin/services/pdf), which facilitates
a *change and test* type of development cycle. Once you are satisfied with a template you can use it's *template-id* in API calls to:
* Initiate asynchronous *Jobs* to generate PDF documents, based on a template and data supplied by the application.  Depending on the complexity, it can take seconds to generate one.
* Poll the status of a PDF Generation Job, and
* Get the file ID of the completed PDF for use with the [File Service APIs](https://api.adsp.alberta.ca/platform/?urls.primaryName=File%20service) for managing the PDF file.

For more, in-depth information on how to use the PDF Service please see the [tutorial](https://govalta.github.io/adsp-monorepo/tutorials/pdf-service/introduction.html).
`,
  },
  tags: [
    {
      name: 'Templates',
      description: 'APIs for managing PDF templates.',
    },
    {
      name: 'Generator',
      description: 'APIs to manage asynchronous jobs for generating PDF documents',
    },
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

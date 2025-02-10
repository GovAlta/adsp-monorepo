const tenant = 'autotest';

//<KEYCLOAK_ROOT> is the in-house defined tag, which will be updated in the main.ts
module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'File service',
    version: '1.0.0',
    description: `ADSP's _File Service_ is one that you can use for storing and managing file-based data.
From uploading end-user documentation to storing content for presentation, the service gives you massively scalable,
secure, storage for your data. Based on Microsoft's Azure Blob Storage and, coupled with our
[File Type collections](https://govalta.github.io/adsp-monorepo/tutorials/file-service/file-types.html), the file service gives you full control
over who has access to your data, and who doesn't.

The service provides APIs that allow you to:

- Upload files to Azure Blob cloud Storage
- Scan files for viruses and other malware
- Grant file access permissions
- Associate meta-data with a file, such as its unique ID, who uploaded it, whether or not it was infected, etc.
- Search for files
- Download files as streams

For more information see the [File Service tutorial](https://govalta.github.io/adsp-monorepo/tutorials/file-service/introduction.html).`,
  },
  tags: [
    {
      name: 'File Type',
      description: 'API to retrieve File Type collections. Types are configured via the configuration service.',
    },
    {
      name: 'File',
      description: 'API to upload and download files.',
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

---
title: Working with Files
layout: page
nav_order: 4
parent: File Service
grand_parent: Tutorials
---

## Working With Files

The _File Service_ has two main components;

- APIs, with which your application can mange files, and
- the Tenant Admin Webapp, which lets you configure the service to meet your needs.

### Tenant Admin Webapp

Configuring the _File Service_ is about creating _File Type collections_, and setting up permissions and retention policies for them. You do this through our [Tenant Admin Webapp](https://adsp.alberta.ca). See [File Type collections](/adsp-monorepo/tutorials/access-service/file-types.html) for more information.

### API

You can learn the specific details of how an API works from our [Swagger Documentation](https://api.adsp.alberta.ca/autotest/?urls.primaryName=File%20service); here we'll just give a brief overview of the functionality supplied through them.

All API calls to the _File Service_ require authentication via Keycloak. See the instructions for [setting up a tenant and getting access tokens](/adsp-monorepo/tutorials/access-service/introduction.html) for details on how to do this.

### Uploading

Files are uploaded to Azure Blob Storage and stored as octet streams. In addition to the file, there is a small amount of metadata that gets created and stored along with it, as discussed below.

### File Scanning

When you upload a file, you can specify whether or not it should be scanned for viruses or other malicious software (defaults to scan). Scanning is provided by [ClamAV](https://docs.clamav.net/Introduction.html), an open-source anti-virus toolkit maintained by Cisco Systems Inc. The database is updated frequently, so you can be sure the File Service will be looking for the latest threats. The service is designed to be fast, but you may find there is some delay between uploading and being able to access your file. This should not be an issue with small files.

### Access Permission

Using File Type collections you can specify access permissions based on your tenant (Keycloak) roles. See ADSP [File Type collections](/adsp-monorepo/tutorials/file-service/file-types.html) for more information.

### Metadata

Metadata - or File Properties - is stored along with the file. Metadata includes

| Name         | Description                                                                                                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id           | The file ID with which which you can refer to the file when performing File Service API calls.                                                                                                                    |
| filename     | The name of the file.                                                                                                                                                                                             |
| urn          | Logical URN of the file. You can map the URN to a URL using the [ADSP SDK's](https://github.com/GovAlta/adsp-monorepo/blob/main/libs/adsp-service-sdk/src/directory/serviceDirectory.ts) getResourceUrl() method. |
| size         | File Size                                                                                                                                                                                                         |
| typeName     | Name of the File Type collection to which the file belongs to.                                                                                                                                                    |
| record ID    | An optional, arbitrary, application record-ID that can be used to cross reference the file with application data.                                                                                                 |
| created date | Date the file was uploaded.                                                                                                                                                                                       |
| created by   | The name and ID of the authenticated user that uploaded the file.                                                                                                                                                 |
| scanned      | True if the file was scanned when uploaded.                                                                                                                                                                       |
| infected     | True if a virus or other malware was found in the file contents.                                                                                                                                                  |

### Searching

You can search through your uploaded files using the following criteria

- file names matching, or partially matching, an input string
- metadata matching a specific record ID
- those files in a specific File Type collection

### Downloading

Files are stored, and downloaded, as octet streams.

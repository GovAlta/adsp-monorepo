---
title: Working with Files
layout: page
nav_order: 4
parent: File Service
grand_parent: Tutorials
---

## Working With Files

### Uploading

Files are uploaded to Azure Blob Storage and stored as octet streams.

### Scanning

When you upload a file, you can specify whether or not it should be scanned for viruses or other malicious software (default's to scan).

### Access Permission

Using File Type collections you can specify access permissions based on your tenant (Keycloak) roles. See ADSP [File Types](/adsp-monorepo/tutorials/file-service/file-types.md) for more information.

### Metadata

Metadata - or File Properties - is stored along with the file. Metadata includes
| Name | Description |
| id | The file ID with which which you can refer to the file when performing File Service API calls. |
| filename | The name of the file. |
| urn | Logical URN of the file. You can map the URN to a URL using the [ADSP SDK's](https://github.com/GovAlta/adsp-monorepo/blob/main/libs/adsp-service-sdk/src/directory/serviceDirectory.ts) getResourceUrl() method. |
| size | File Size |
| typeName | Name of the File Type collection to which the file belongs to. |
| record ID | An optional application ID that can be used to cross reference the file with application data. |
| created date | Date the file was uploaded. |
| created by | The name and ID of the authenticated user that uploaded the file. |
| scanned | True if the file was scanned when uploaded. |
| infected | True if a virus or other malware was found in the file contents. |

### Searching

### Downloading

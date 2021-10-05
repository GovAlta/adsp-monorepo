---
layout: page
title: File service
nav_order: 7
parent: Services
---

# File service
File service provides the ability to upload and download files. Applications can upload files via multipart/form-data requests with the file and related metadata, then later allow users to access metadata of or download the file.


## Client roles
client `urn:ads:platform:file-service`

| name | description |
|:-|:-|
| file-admin | Administrator role for the file service. This role grants read and write access across all files.  |

## Concepts
### File type
File type represents a category of files with specific access roles. For example, a 'Supporting Documents' file type may allow `intake-application` role to upload files and `assessor` role to download the files.

### File

---
title: Security
layout: page
nav_order: 3
parent: File Service
grand_parent: Tutorials
---

## Security

On its own, Azure Blob Storage is a cloud-based, facility that keeps your data as secure as you want it to be. On top of that, the File Service has its own security features to help applications dictate who has access to files, and who does not.

#### Access

Azure organizes files [hierarchically](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction) by account, container, and then files. The File Service uses one account, which has one container for each tenant using the service. When calling File Service APIs, you must [authorize](/adsp-monorepo/tutorials/access-service/introduction.html) them with _Keycloak_ authorization tokens, which contain your tenant ID. Organizing files this way ensures each tenant has access to their files, and only their files.

Only _File Service_ has direct access to the files stored in Azure Blob. Applications can only get access to them via the APIs. However, the APIs support role based access through [File Type collections](/adsp-monorepo/tutorials/file-service/file-types.html). You can create collections, assign Tenant roles to them, and then add files to the collection when they are uploaded. The file inherits the access permissions of the collection. This gives developers fine-grained control over which applications and users have read or write access to the files.

### Durability

Multiple copies of your files are stored by Azure Blob Storage in order to assure high durability. For the curious, we use [RA-GRS redundancy](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy#geo-redundant-storage) which gives you 99.(13)9% (13 9's) durability. It achieves this by storing 3 copies of the data in a single location (on separate servers) and 1 copy at a geographically separate location.

### Encryption

All data stored in Azure Blob is [encrypted](https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption?toc=%2Fazure%2Fstorage%2Fblobs%2Ftoc.json&bc=%2Fazure%2Fstorage%2Fblobs%2Fbreadcrumb%2Ftoc.json) using 256 bit AES encryption.

### Retention

The _File Service_ gives you fine grained control of file retention through our [File Type collections](/adsp-monorepo/tutorials/file-service/file-types.html). You can set the retention policy for files in the collection, and those that have been untouched for longer than the retention period will be automatically deleted.

Note: this policy does support any specific retention policies for _deleted files_ that may be required for your application. i.e. Once a file has been deleted from the File Service the data will be lost after a 7 day retention period that is set in the _Azure Blob_ configuration. You can, however, define the required retention period in your _File Type collection_ and let the _File Service_ mange the lifecycle. The file will only be deleted once it has been untouched for the defined period of time.

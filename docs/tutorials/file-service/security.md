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

Only _File Service_ has direct access to the files stored in Azure Blob. Applications can only get access to them via the APIs.

### Redundancy

Multiple copies of your files are stored by Azure Blob Storage in order to assure high durability. For the curious, we use [RA-GRS redundancy](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy#geo-redundant-storage) which gives you 99.(13)9% (13 9's) durability. It achieves this by storing 3 copies of the data in a single location (on separate servers) and 1 copy at a geographically separate location.

#### Encryption

All data stored in Azure Blob is [encrypted](https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption?toc=%2Fazure%2Fstorage%2Fblobs%2Ftoc.json&bc=%2Fazure%2Fstorage%2Fblobs%2Fbreadcrumb%2Ftoc.json) using 256 bit AES encryption.

#### Retention

---
title: File Types
layout: page
nav_order: 3
parent: File Service
grand_parent: Tutorials
---

## File Types

A **File type** is a _named collection_ of files. You can assign certain file-properties to a collection, such as access permissions, and when files are added to it they will inherit them. So, for example, you can create a new file type named _public_, and assign it a _read-only_ file-property. Any files added to the _public_ collection will then be immutable, but accessible to anyone.

This gives developers a means for organizing and managing files with shared properties. You would want to create a File Type collection to

- group all files associated with an application or application feature together
- group all files associated with an end-user together
- protect sensitive information from unauthorized access
- grant public, read-only access to files

### Access Permission

Using the ADSP [File Type Editor](https://adsp.alberta.ca) you can create new File Types and assign them file-properties. Currently, the only file-properties associated with a _File Type_ revolve around access permissions. The editor presents a set of **Keycloak** roles that have been set up for your tenant, plus a set of roles for ADSP Platform Services that may need to access the files, such as the [PDF Service](/adsp-monorepo/tutorials/pdf-service/introduction.html).
![](/adsp-monorepo/assets/file-service/add-file-type.png)
When you give read or write access to a role, only users or applications with that role can access the files in the collection.

There is also an option to grant public read-only permission for any file added to the collection.

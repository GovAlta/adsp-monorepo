---
title: Introduction
layout: page
nav_order: 1
parent: PDF Service
grand_parent: Tutorials
---

## Introduction

The ADSP PDF service allows developers to build templates for their applications to use in generating customized, PDF, documentation for their end users. It bundles together two powerful technologies - [Puppeteer](https://pptr.dev/) and [Handlebars](https://handlebarsjs.com/guide/) - to yield a simple, effective, technique for managing documents requested by end users such as *client reports, registrations, certifications*, and other official GOA documentation.

#### Components

Two main components are used for managing pdf templates:

- The ADSP Tenant Admin Webapp, which provides a GUI for developers to build, test and save their templates using HTML, CSS and a custom designed set of embedded template variables,
- APIs to access the saved templates and generate a PDF document using a template and application-supplied values for the input data.

The template engine is based on [Puppeteer](https://pptr.dev/) - used for the HTML/CSS to PDF conversion process, and [Handlebars](https://handlebarsjs.com/guide/), which manages template customization.

#### Learn More

- Here are some brief introductions to [Puppeteer](/adsp-monorepo/tutorials/pdf/puppeteer.html) and [Handlebars](/adsp-monorepo/tutorials/pdf/handlebars.html)
- Learn more about how to [build a sophisticated template](/adsp-monorepo/tutorials/pdf/building-a-template.html) using ADSP's Template Editor
- Learn more about [generating a PDF from a template](/adsp-monorepo/tutorials/pdf/generate-a-pdf.html)

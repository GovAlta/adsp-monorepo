---
title: Introduction
layout: page
nav_order: 1
parent: PDF Service
grand_parent: Tutorials
---

## Introduction

The PDF service allows developers to build templates for their applications to use in generating customized, PDF, documentation for their end users. It bundles together two powerful technologies - [Puppeteer](https://pptr.dev/) and [Handlebars](https://handlebarsjs.com/guide/) - to yield a simple, effective, technique for managing documents requested by end users such as *client reports, registrations, certifications*, and other official GOA documentation.

#### Components

Two main components are used for managing pdf templates:

- The ADSP Tenant Admin Webapp, which provides a GUI for developers to build, test and save their template using HTML, CSS and a custom designed set of embedded template variables
- APIs to access the saved templates and generate a PDF document using a template and application-supplied values for the template variables

The templating engine is based on [Puppeteer](https://pptr.dev/) - used for the HTML/CSS to PDF conversion process, and [Handlebars](https://handlebarsjs.com/guide/), which manages template customization.

#### Learn More

- Here are some brief introductions to [Puppeteer](/tutorials/puppeteer.html) and [Handlebars](/tutorials/handlebars.html)
- Learn more about how to [build a sophisticated template](/tutorials/building-a-template.html)
- Learn more about [generating a PDF from a template](/tutorials/building-a-template.html)

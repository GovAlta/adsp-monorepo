---
title: Puppeteer
layout: page
nav_order: 2
parent: PDF Service
grand_parent: Tutorials
---

[Puppeteer](https://pptr.dev/) is the heart of the PDF generator and is the final arbitrator on how a generated document will look.  Based on a headless chromium engine, it allows users to input HTML and CSS to render a PDF document.  Because it's based on chromium, it's best to work on the template using Chrome, or any other Chromium based browser.

While puppeteer does a great job of turning HTML into PDF, there are things that must be taken into consideration to get a clean looking document that are non-issues for a continuous media stream, like a browser.  These include

- Page headers and footers
- Page margins
- Page breaks
- Widows and orphans
- Box styling over page breaks
- Page numbering

Fortunately, most of these issues can be address through CSS specifically implement to address print media concerns.  Here's a [good tutorial](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/) on CSS for print media.

---
title: The Form App
layout: page
nav_order: 7
parent: Form Service
grand_parent: Tutorials
---

## Form App

The _Form App_ is a standalone application designed to allow users to securely log in and enter data into various _forms_. It utilizes the _Form Service_ APIs to retrieve the schemas and data necessary to render specific forms, save data as it is entered, and submit the forms for review upon completion. This means developers can quickly build and deploy forms without the need to create a new application from scratch.

The form data is stored in an ADSP database and can be accessed via [an API call](/adsp-monorepo/tutorials/task-service/task-app.html) or through the [Task App](/adsp-monorepo/tutorials/task-service/task-app.html), another standalone application by ADSP. If your requirements include simply reviewing and assessing the information (e.g., determining if an applicant is successful, after which a clerk or another application takes over), then the _Task App_ is ideal, requiring no additional coding. For more sophisticated processing of the information, developers can build their own applications to access the form data from ADSP and potentially distribute it to their own databases for further processing and reporting.

The URL for a specific form is derived from your ADSP tenant-name and the ID of the form. E.g. the URL below allows a user to log in and work with the _Farmers Market License Application_ form in the _AFIDS_ tenant:

```
https://form.adsp-uat.alberta.ca/afids/Farmers-Market-License-Application
```

### Users

Forms can be configured to allow only those people with GoA or Alberta.ca credentials to access and fill them in. This gives users the best experience, as they will be able to fill in the information over several sessions, as needed. In addition, they will be able to initiate online conversations with form administrators if they have questions.

However, you can also configure a form to allow anonymous access. Anyone will be able to fill in and submit a form, without logging in. In this case, they will have to complete the form in one session, and they will not have access to the "chat" capability.

### Security

Developers can define the roles that are required to create, review and disposition their forms, as described in the [security section](/adsp-monorepo/tutorials/task-service/security.html) of the tutorial. In addition, they will need the ADSP-specific roles for accessing a form. The former should be specific to your _Tenant_ and _Form Definition_, as they will lock down access so that only your users can log-in and fill in the information. For the _Form App_, a user will need to be an _applicant_. _Clerks_ and _assessors_ will be able to review and disposition this forms through the [Task App](/adsp-monorepo/tutorials/task-service/task-app.html).

#### Client Security

The _Form App_ uses the _form-app_ keycloak client, configured in your tenant, to access the necessary resources, specifically _urn:ads:platform:form-app_. To ensure that resource access is requested with a valid access token, the token must include both the _form service audience_ and the _comment service audience_.

If your tenant is recent you can likely just ignore its configuration, as that will have been done for you when you when it was created. If not, however, you must add the client and configure it as follows:

![](/adsp-monorepo/assets/form-service/formAppClientConfiguration.png){: width="800" }

You can added an audience by clicking on the "Create" button and filling in the information as shown here:

![](/adsp-monorepo/assets/form-service/addAudience.png){: width="400" }

### User Experience

Ideally users will be able to access the link to the _Form App_ directly from the alberta.ca website. Clicking on it will bring them to the form app where they will be asked to log in. If all their roles and permissions are correct they will see the form in question, e.g.

![](/adsp-monorepo/assets/form-service/formAppExample.png){: width="800" }

### Summary PDF

You can give users of the Form App the capability of downloading a PDF summary of their completed application. In the [Tenant Management Webapp](https://adsp-uat.alberta.ca), go to the form editor for the form in question. There you will see a "Lifecycle" tab and a checkbox for creating a PDF upon submission.

![](/adsp-monorepo/assets/form-service/lifecycleTab.png){: width="400" }

When checked you will see a PDF Preview tab in on the right-hand pane of the editor that shows what the generated PDF will look like. In the form app the user will see this after submission:

![](/adsp-monorepo/assets/form-service/PDF-download.png){: width="400" }

**NOTE**: The download capability is only available to forms that require login. It is not available to anonymous forms.

### ADSP form-app client audience

To fetch summary PDF file, aud of the access token used in the form app must include <b>urn:ads:platform:form-service</b> and <b>urn:ads:platform:form-gateway</b>. Otherwise, the user will see 401 error message on the submission summary page.

Based on the business logic, there are different ways to add the two audiences into access token. The most widely used method is to add the two audiences on <b>urn:ads:platform:form-app</b>. The following are the details:

- Navigate to the client configuration of the <b>urn:ads:platform:form-app</b> client.
- Click the <b>Client scopes</b> and choose the <b>urn:ads:platform:form-app-dedicated</b> scope.
  ![](/adsp-monorepo/assets/form-service/form-app-client-scope.png){: width="600" }
- Add the two audience mappers in the <b>urn:ads:platform:form-app-dedicated</b> scope. The configurations of the two audiences mappers are shown as follows.
  ![](/adsp-monorepo/assets/form-service/form-service-aud-mapper.png){: width="400" }
  ![](/adsp-monorepo/assets/form-service/form-gateway-aud-mapper.png){: width="400" }

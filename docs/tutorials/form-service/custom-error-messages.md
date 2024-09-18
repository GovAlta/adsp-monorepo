---
title: Custom error messages
layout: page
parent: Form Service
grand_parent: Tutorials
nav_exclude: false
---

### Custom Error Messages

To modify the standard default messages that Ajv provides for the error messages such pattern, minLength, maxLength etc to a more user friendly and descriptive error message you will need to modify the data schema in the form definition.

There are a couple approaches you can take to customizing the error messages and they involve modifying the data schema.

The first approach is to add an `errorMessage` object to the JSON data schema describing the input field. Then map each constraint on the input field to an error message inside the object, as follows:

```
{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "minLength": 2,
      "maxLength": 15,
      "pattern": "^[a-zA-Z]*$",
      "errorMessage": {
        "pattern": "First name must only contain letters.  ",
        "minLength": "Minimum length for first name is 2 characters.",
        "maxLength": "Max length for first name is 15 characters."
      }
    }

  }
```

If you don't want to override AJV's default error message for some of the constraints, simply leave it out of the errorMessage object.

In the example below, only the `pattern` constraint will have a custom error message, while `minLength` and `maxLength` will have the standard Ajv error message.

```
{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "minLength": 2,
      "maxLength": 15,
      "pattern": "^[a-zA-Z]*$",
      "errorMessage": {
        "pattern": "First name must only contain letters."
      }
    }

  }
```

In cases where you just want to have a default custom error message for all the constraints in your schema, you can use `_` in the `errorMessage` to define one concise error message for them all.

For example:

```
{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "minLength": 2,
      "maxLength": 15,
      "pattern": "^[a-zA-Z]*$",
      "errorMessage": {
        "_": "default error message for first name."
      }
    }
  }

```

This will display `default error message for first Name` for the pattern, minLength, maxLength constraints instead of using the standard Ajv error messsages for each constraints.

Furthermore, customizing error messages doesnt limit constraint to `pattern`, `maxLength`, `minLength`.

Any standard JSON schema keyword that can be used to constraint an input field, such as type or format can have its own custom error messages.

The exception to this is that the required field validation for an input is not customizable and
the error message will always show as {fieldName} is required if it left empty..

Please visit [Ajv errors website](https://ajv.js.org/packages/ajv-errors.html) for more information on customizing error messages.

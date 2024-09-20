---
title: Subscribers
layout: page
nav_order: 3
parent: Notification Service
grand_parent: Tutorials
---

## Subscribers

Subscribers and subscriptions are created by your application through the [Notification Service APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Notification%20service), or you can allow your users to manage their own subscriptions through the ADSP _Subscriber App_. Either way, your subscribers will be notified whenever your application triggers a _domain event_ that is associated with the _notification type_.

## Anonymous Users

To create a subscription you need subscribers, and subscribers are users that have logged in to your application and have known userId's and email addresses. But what about applications whose users don't log in, those that cater to anonymous users? You can still use the notification service. When you create a notification type you can configure it to notify subscribers, or to send the notification directly to an email address:

![](/adsp-monorepo/assets/notification-service/direct-notification.png){: width="300" }

If you have a known user that is to receive notification, you can input their email address directly here. This is useful for situations where there is a single individual responsible for, say, reviewing submitted applications. However, you may not know the user's email address until runtime. In this case you would want to be able to supply the email address dynamically. Here's what you do:

Create a new event type with a payload that includes the user's email address:

![](/adsp-monorepo/assets/notification-service/event-payload.png){: width="300" }

Then, when creating a new _Notification Type_ you would add the name of the property to the _Address Path_ input field, e.g. with the above example the _Address Path_ would contain _userEmailAddress_.

Finally, when you want to trigger a notification you would POST the event with the following payload:

```JSON
{
  userEmailAddress: "example@example.com"
}
```

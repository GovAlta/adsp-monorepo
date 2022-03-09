import React, { FunctionComponent } from 'react';

export const BotNotifications: FunctionComponent = () => {
  return (
    <section>
      <h2>Bot notifications</h2>
      <p>
        Notification service can send Slack or Teams messages using a Bot. Invite the ADSP Notification bot into your
        channel then message it for the subscriber address to use.
      </p>
      <p>For Slack channels the format is: {'slack/<Team ID>/<Channel ID>'}.</p>
      <p>For Teams the format is: {'msteams/<Channel ID>'}.</p>
    </section>
  );
};

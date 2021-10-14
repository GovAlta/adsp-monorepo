import React, { FunctionComponent } from 'react';
import GoALinkButton from "../../../../components/LinkButton";

export const NotificationsTypes: FunctionComponent = () => {
  return (
    <div>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <GoALinkButton data-testid="add-notification-type" to={``} buttonType="primary">
        Add a notification type
      </GoALinkButton>
    </div>
  );
};

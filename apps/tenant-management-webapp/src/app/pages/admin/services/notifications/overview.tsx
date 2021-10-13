import React, { FunctionComponent } from 'react';
import GoALinkButton from "../../../../components/LinkButton";

export const NotificationsOverview: FunctionComponent = () => {
  return (
    <div>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <p>
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      </p>
      <GoALinkButton data-testid="add-notification-type" to={``} buttonType="primary">
        Add a notification type
      </GoALinkButton>
    </div>
  );
};

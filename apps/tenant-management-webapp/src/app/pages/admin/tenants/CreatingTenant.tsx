import React from 'react';
import CreatingRealmCarousel0 from '@assets/creatingRealmCarousel0.png';
import CreatingRealmCarousel1 from '@assets/creatingRealmCarousel1.png';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';

export default () => {
  return (
    <Page>
      <Main>
        <h2>Your tenant is being created</h2>
        <div>This should not take long, please explore our features while you wait</div>

        <h2>Introducing our Access Service</h2>
        <img src={CreatingRealmCarousel0} alt="Access Service" />
        <p>
          Quickly provide your project with a secure, robust and easy to use authentication system that supports
          Government of Alberta, Microsoft and Google credentials out of the box
        </p>

        <hr />

        <h2>Update your users</h2>
        <img src={CreatingRealmCarousel1} alt="Access Service" />
        <p>
          Through our notification service, we make it easy to send personalized messages from a single template, for
          SMS or email. You do not need technical knowledge to use it. Yay!
        </p>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};

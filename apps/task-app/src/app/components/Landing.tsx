import { GoAAppHeader, GoAHeroBanner, GoAMicrositeHeader } from '@abgov/react-components-new';
import React, { FunctionComponent } from 'react';

export const Landing: FunctionComponent = () => (
  <React.Fragment>
    <GoAMicrositeHeader type="alpha" />
    <GoAAppHeader url="/" heading="Alberta Digital Service Platform - Task management">
      {/* <GoAButton onClick={() => dispatch(authenticateUser(null))}>Sign in</GoAButton> */}
    </GoAAppHeader>
    <GoAHeroBanner heading="Task management" backgroundUrl={'../assets/banner.jpg'}>
      Work on tasks.
    </GoAHeroBanner>
    <main></main>
    <footer>
      <div className="goa-socialconnect">
        <div className="goa-title">Connect with us on</div>
        <ul>
          <li>
            <a href="https://github.com/abgov" rel="noreferrer" target="_blank">
              GitHub
            </a>
          </li>
        </ul>
      </div>
    </footer>
  </React.Fragment>
);

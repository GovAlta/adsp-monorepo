import { GoabHeroBanner } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import styles from './app.module.scss';

export const Landing: FunctionComponent = () => {
  return (
    <>
      <GoabHeroBanner
        heading="Chat: example of ADSP app and service"
        backgroundUrl={'../assets/banner.jpg'}
      />
      <main>
        <section>
          <h2>Welcome to ADSP chat example!</h2>
          <p>
            This is a full-stack example that utilizes{' '}
            <a href="https://adsp.alberta.ca">
              Alberta Digital Service Platform (ADSP)
            </a>
            .
          </p>
          <h3>Here is how it uses the platform:</h3>
          <ul className={styles.nextSteps}>
            <li>
              Sign in and authorize users using <b>Access service</b>.
            </li>
            <li>
              Lookup URLs for other platform services from{' '}
              <b>Directory service</b>.
            </li>
            <li>
              Use <b>Configuration service</b> to configure rooms.
            </li>
            <li>
              Send chat messages as domain events via the <b>Event service</b>.
            </li>
            <li>
              "Event source" messages from the event log stored in{' '}
              <b>Value service</b>.
            </li>
            <li>
              Receive messages via a <b>Push service</b> websocket gateway.
            </li>
            <li>
              Upload and download meme images via <b>File service</b>.
            </li>
          </ul>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className="goa-socialconnect">
          <div className="goa-title">Connect with us on</div>
          <ul>
            <li className={styles.github}>
              <a
                href="https://github.com/GovAlta/adsp-samples"
                rel="noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
};

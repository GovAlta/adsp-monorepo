import { GoabAppHeader, GoabButton } from '@abgov/react-components';
import { FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';

interface FormHeaderProps {
  className?: string;
  heading: string;
  // Messages are only offered on forms whose definition creates a support topic.
  showMessages?: boolean;
  unreadMessages?: number;
  onToggleMessages?: () => void;
  // Account actions; rendered in the app header utilities slot.
  children?: ReactNode;
}

const FormHeaderComponent: FunctionComponent<FormHeaderProps> = ({
  className,
  heading,
  showMessages,
  unreadMessages,
  onToggleMessages,
  children,
}) => (
  <div className={className}>
    {/* The app header falls back to a '[Service Name]' placeholder when heading is empty, so it is
        given a blank one and the space it reserves is collapsed in the styles below. */}
    <GoabAppHeader url="/" heading=" ">
      <div slot="utilities">
        <span style={{ display: 'none' }}></span>
        {children}
      </div>
    </GoabAppHeader>
    <div className="headerDetails">
      <span className="formName" data-testid="form-header-name">
        {heading}
      </span>
      {showMessages && (
        <GoabButton
          type="tertiary"
          size="compact"
          leadingIcon="chatbubble-ellipses"
          testId="form-messages-toggle"
          onClick={onToggleMessages}
        >
          {unreadMessages > 0 ? `Messages (${unreadMessages})` : 'Messages'}
        </GoabButton>
      )}
    </div>
  </div>
);

// The app header supplies the logo and the account actions only; the form name and the messages
// toggle sit under them in a second row, and the separator and background belong to the whole
// header area rather than to the app header alone.
export const FormHeader = styled(FormHeaderComponent)`
  --goa-app-header-color-bg: transparent;
  --goa-app-header-border-bottom: none;
  --goa-app-header-min-width-service-name: 0;
  --goa-app-header-max-width-service-name: 0;

  background: var(--goa-color-greyscale-50);
  border-bottom: var(--goa-border-width-s) solid var(--goa-color-greyscale-150);

  .headerDetails {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--goa-space-m);
    /* The app header pads its own row with these tokens, switching at 624px, so the form name lines
       up under the logo and the messages control under the sign out link. */
    padding: 0 var(--goa-app-header-padding-h-mobile) var(--goa-space-s);
  }

  @media (min-width: 624px) {
    .headerDetails {
      padding-left: var(--goa-app-header-padding-h-desktop);
      padding-right: var(--goa-app-header-padding-h-desktop);
    }
  }

  .formName {
    font: var(--goa-app-header-typography-service-name);
    color: var(--goa-app-header-color-service-name);
    overflow-wrap: anywhere;
  }
`;

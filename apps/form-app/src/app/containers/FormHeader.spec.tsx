import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import { FormHeader } from './FormHeader';

// The GoA button is a web component; it isn't defined in jsdom, so clicks are simulated with the
// custom event that the React wrapper listens for.
function clickMessages(container: HTMLElement) {
  const button = container.querySelector('goa-button[testid="form-messages-toggle"]');
  fireEvent(button, new CustomEvent('_click'));
}

describe('FormHeader', () => {
  it('shows the form name under the logo', () => {
    const { getByTestId } = render(<FormHeader heading="Auto test form" />);

    expect(getByTestId('form-header-name')).toHaveTextContent('Auto test form');
  });

  it('renders the account actions it is given', () => {
    const { getByText } = render(
      <FormHeader heading="Auto test form">
        <span>Roy Styan</span>
      </FormHeader>,
    );

    expect(getByText('Roy Styan')).toBeInTheDocument();
  });

  // The messages control is only for definitions that create a support topic.
  it('does not show messages by default', () => {
    const { container } = render(<FormHeader heading="Auto test form" />);

    expect(container.querySelector('goa-button[testid="form-messages-toggle"]')).toBeNull();
  });

  it('shows messages without a count when nothing is unread', () => {
    const { container } = render(<FormHeader heading="Auto test form" showMessages={true} unreadMessages={0} />);

    expect(container.querySelector('goa-button[testid="form-messages-toggle"]')).toHaveTextContent('Messages');
    expect(container.querySelector('goa-button[testid="form-messages-toggle"]')).not.toHaveTextContent('(');
  });

  it('shows the number of unread messages', () => {
    const { container } = render(<FormHeader heading="Auto test form" showMessages={true} unreadMessages={3} />);

    expect(container.querySelector('goa-button[testid="form-messages-toggle"]')).toHaveTextContent('Messages (3)');
  });

  it('toggles the drawer when messages is clicked', () => {
    const onToggleMessages = jest.fn();
    const { container } = render(
      <FormHeader
        heading="Auto test form"
        showMessages={true}
        unreadMessages={1}
        onToggleMessages={onToggleMessages}
      />,
    );

    clickMessages(container);

    expect(onToggleMessages).toHaveBeenCalled();
  });
});

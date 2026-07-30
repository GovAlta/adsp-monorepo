import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalendarEventFilterErrorWrapper } from './styled-components';

describe('CalendarEventFilterErrorWrapper', () => {
  // Regression guard: the badge and the message used to be bare siblings in a fragment, so they
  // were baseline-aligned in an inline formatting context and the message compensated with
  // line-height: 2.5rem and top: -3px. That left the icon and text on different horizontal levels.
  it('centres its children on a shared horizontal level', () => {
    const { getByTestId } = render(
      <CalendarEventFilterErrorWrapper data-testid="wrapper">
        <span>icon</span>
        <span>message</span>
      </CalendarEventFilterErrorWrapper>
    );

    const styles = getComputedStyle(getByTestId('wrapper'));
    expect(styles.display).toBe('flex');
    expect(styles.alignItems).toBe('center');
  });
});

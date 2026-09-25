import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Ajv from 'ajv';
import { JsonForms } from '@jsonforms/react';
import { JsonFormsRendererRegistryEntry, UISchemaElement } from '@jsonforms/core';
import { GoARenderers, GoACells } from '../../../index';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from './context';
import { ContextProviderFactory } from '../../Context';
import { NavigationTarget } from './util/navigationTarget';

const dataSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    city: { type: 'string' },
  },
};

const uischema = {
  type: 'Categorization',
  options: { variant: 'pages' },
  elements: [
    {
      type: 'Category',
      label: 'Name',
      elements: [
        { type: 'Control', scope: '#/properties/firstName' },
        { type: 'Control', scope: '#/properties/lastName' },
      ],
    },
    {
      type: 'Category',
      label: 'Address',
      elements: [{ type: 'Control', scope: '#/properties/city' }],
    },
  ],
};

// The review summary's Change button navigates through goToPage with the scope of the field it
// targeted. Standing in for one control lets a test reach that call the same way.
let goToPage: (id: number, scope?: string) => void;

const CaptureNavigationRenderer = () => {
  goToPage = (React.useContext(JsonFormsStepperContext) as JsonFormsStepperContextProps).goToPage;
  return null;
};

const captureNavigation: JsonFormsRendererRegistryEntry = {
  tester: (element: UISchemaElement) =>
    (element as UISchemaElement & { scope?: string })?.scope === '#/properties/lastName' ? 100 : -1,
  renderer: CaptureNavigationRenderer,
};

const renderForm = () =>
  render(
    <JsonForms
      schema={dataSchema}
      uischema={uischema}
      data={{}}
      renderers={[...GoARenderers, captureNavigation]}
      cells={GoACells}
      ajv={new Ajv({ allErrors: true, verbose: true, strict: false })}
      onChange={() => undefined}
    />,
  );

// GoA web components surface the testId prop as a plain `testid` attribute, and the React wrapper
// listens for the component's own `_click` event rather than a native one.
const clickNavButton = (testId: string): void => {
  const button = document.querySelector(`goa-button[testid="${testId}"]`);
  if (!button) {
    throw new Error(`no nav button ${testId}`);
  }
  fireEvent(button, new CustomEvent('_click'));
};

describe('RenderPages scroll behaviour', () => {
  let scrollSpy: jest.Mock;

  beforeEach(() => {
    scrollSpy = jest.fn();
    // jsdom does not implement scrollIntoView at all.
    (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = scrollSpy;
  });

  afterEach(() => {
    delete (Element.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it('scrolls to the top when the user moves to the next step', () => {
    renderForm();
    fireEvent.click(screen.getByTestId('page-ref-0'));
    scrollSpy.mockClear();

    clickNavButton('pages-save-continue-btn');

    expect(scrollSpy).toHaveBeenCalled();
  });

  it('scrolls to the top when the user moves to the previous step', () => {
    renderForm();
    fireEvent.click(screen.getByTestId('page-ref-0'));
    clickNavButton('pages-save-continue-btn');
    scrollSpy.mockClear();

    clickNavButton('pages-prev-btn');

    expect(scrollSpy).toHaveBeenCalled();
  });

  it('scrolls only after the step being navigated to is in the DOM', () => {
    // The scroll used to run inside the click handler, which is before React has committed
    // anything — so it measured the page the user was leaving. On steps of very different heights
    // the browser then painted the new page at the old offset and corrected it a frame later.
    const stepsPresentWhenScrolled: string[] = [];
    scrollSpy.mockImplementation(() => {
      if (document.querySelector('[data-testid="step_1-content-pages"]')) {
        stepsPresentWhenScrolled.push('step_1');
      }
      if (document.querySelector('[data-testid="step_0-content-pages"]')) {
        stepsPresentWhenScrolled.push('step_0');
      }
    });

    renderForm();
    fireEvent.click(screen.getByTestId('page-ref-0'));
    stepsPresentWhenScrolled.length = 0;

    clickNavButton('pages-save-continue-btn');

    expect(stepsPresentWhenScrolled).toContain('step_1');
    expect(stepsPresentWhenScrolled).not.toContain('step_0');
  });

  it('uses an instant scroll so the step is usable right away', () => {
    renderForm();
    fireEvent.click(screen.getByTestId('page-ref-0'));
    scrollSpy.mockClear();

    clickNavButton('pages-save-continue-btn');

    expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
  });

  describe('arriving from a Change deep link', () => {
    it('scrolls the targeted control into view rather than the top of the step', () => {
      // Scrolling to the top as well would paint the top of the page and then jump to the field a
      // frame later.
      renderForm();
      fireEvent.click(screen.getByTestId('page-ref-0'));
      scrollSpy.mockClear();

      act(() => {
        goToPage(1, '#/properties/city');
      });

      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
      expect(scrollSpy.mock.calls.every(([options]) => options?.block === 'center')).toBe(true);
    });

    it('scrolls to the top when navigating to a step without a target', () => {
      renderForm();
      fireEvent.click(screen.getByTestId('page-ref-0'));
      scrollSpy.mockClear();

      act(() => {
        goToPage(1);
      });

      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto' });
    });
  });
});

// CS-5474: a host whose summary is on a separate page mounts the form fresh with the target in hand.
// Nothing has touched the target step yet, so its errors have to be revealed by the arrival itself.
describe('RenderPages arriving from a navigation target', () => {
  const requiredSchema = { ...dataSchema, required: ['city'] };
  const ContextProvider = ContextProviderFactory();

  beforeEach(() => {
    (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = jest.fn();
  });

  afterEach(() => {
    delete (Element.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
  });

  const renderWithTarget = (navigationTarget: NavigationTarget) =>
    render(
      <ContextProvider navigationTarget={navigationTarget}>
        <JsonForms
          schema={requiredSchema}
          uischema={uischema}
          data={{ firstName: 'Alex' }}
          renderers={GoARenderers}
          cells={GoACells}
          ajv={new Ajv({ allErrors: true, verbose: true, strict: false })}
          onChange={() => undefined}
        />
      </ContextProvider>,
    );

  const cityError = (): string | null => document.querySelector('goa-form-item[testid="city"]')?.getAttribute('error');

  it('shows the error on the empty required field it was sent to fix', () => {
    renderWithTarget({ scope: '#/properties/city' });

    expect(cityError()).toBe('City is required');
  });

  it('leaves the step quiet when sent to the page rather than a field', () => {
    renderWithTarget({ pageId: 'page-2' });

    expect(document.querySelector('goa-form-item[testid="city"]')).not.toBeNull();
    expect(cityError()).toBeFalsy();
  });
});

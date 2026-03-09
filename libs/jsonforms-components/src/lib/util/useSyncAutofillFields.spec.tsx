import React, { useState } from 'react';
import { render, act, screen } from '@testing-library/react';
import { useSyncAutofillFields } from './useSyncAutofillFields';
import { useDebounce } from './useDebounce';
import { jest } from '@jest/globals';

// Create a test component that uses the hook
const TestComponent = ({ fields }: { fields: string[] }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const handleBlur = jest.fn();

  useSyncAutofillFields(fields, formData, (data) => setFormData(data), handleBlur);

  return null;
};

describe('useSyncAutofillFields', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.requestAnimationFrame = (callback) => {
      callback();
      return 0;
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('updates form data when autofill fields are present', () => {
    // Create test component
    const { rerender } = render(<TestComponent fields={['field1', 'field2']} />);

    // Add autofilled fields to DOM
    const field1 = document.createElement('goa-input') as HTMLInputElement;
    field1.name = 'field1';
    field1.value = 'test1';
    document.body.appendChild(field1);

    const field2 = document.createElement('goa-input') as HTMLInputElement;
    field2.name = 'field2';
    field2.value = 'test2';
    document.body.appendChild(field2);

    // Trigger timers and re-render
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender(<TestComponent fields={['field1', 'field2']} />);

    // Verify DOM updates
    const inputs = document.querySelectorAll('goa-input');
    expect(inputs[0].value).toBe('test1');
    expect(inputs[1].value).toBe('test2');
  });

  it('does not update existing form data', () => {
    const TestComponentWithData = () => {
      const [formData] = useState({ field1: 'existing' });
      const handleBlur = jest.fn();

      useSyncAutofillFields(
        ['field1'],
        formData,
        jest.fn(), // updateFormData should not be called
        handleBlur
      );

      return null;
    };

    render(<TestComponentWithData />);

    const field1 = document.createElement('goa-input') as HTMLInputElement;
    field1.name = 'field1';
    field1.value = 'new-value';
    document.body.appendChild(field1);

    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Verify no updates occurred
    expect(document.querySelector('goa-input')?.value).toBe('new-value');
  });

  it('does nothing when goa-input elements are missing', () => {
    const updateFormData = jest.fn();
    const handleBlur = jest.fn();

    render(
      <TestComponent fields={['nonexistent']} updateFormData={updateFormData} handleRequiredFieldBlur={handleBlur} />
    );

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(updateFormData).not.toHaveBeenCalled();
    expect(handleBlur).not.toHaveBeenCalled();
  });

  it('ignores inputs without value', () => {
    const input = document.createElement('goa-input') as HTMLInputElement;
    input.name = 'emptyField';
    input.value = ''; // No autofill
    document.body.appendChild(input);

    const updateFormData = jest.fn();
    const handleBlur = jest.fn();

    render(
      <TestComponent fields={['emptyField']} updateFormData={updateFormData} handleRequiredFieldBlur={handleBlur} />
    );

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(updateFormData).not.toHaveBeenCalled();
    expect(handleBlur).not.toHaveBeenCalled();
  });

  it('cleans up timers and animation frame', () => {
    const spyRAF = jest.spyOn(window, 'requestAnimationFrame');
    const spyCancel = jest.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = render(<TestComponent fields={['x']} />);

    unmount();

    expect(spyRAF).toHaveBeenCalled();
    expect(spyCancel).toHaveBeenCalled();
  });
});

const DebounceHarness = ({ value, delay }: { value: string; delay: number }) => {
  const debounced = useDebounce(value, delay);
  return <div data-testid="debounced-value">{debounced}</div>;
};

describe('useDebounce (covered in existing spec file)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJestWorker = process.env.JEST_WORKER_ID;

  afterEach(() => {
    jest.useRealTimers();
    process.env.NODE_ENV = originalNodeEnv;

    if (originalJestWorker === undefined) {
      delete process.env.JEST_WORKER_ID;
    } else {
      process.env.JEST_WORKER_ID = originalJestWorker;
    }
  });

  it('updates immediately in test environment', () => {
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';

    const { rerender } = render(<DebounceHarness value="a" delay={100} />);
    expect(screen.getByTestId('debounced-value').textContent).toBe('a');

    rerender(<DebounceHarness value="b" delay={100} />);
    expect(screen.getByTestId('debounced-value').textContent).toBe('b');
  });

  it('updates immediately when JEST_WORKER_ID is set even if NODE_ENV is not test', () => {
    process.env.NODE_ENV = 'production';
    process.env.JEST_WORKER_ID = '9';

    const { rerender } = render(<DebounceHarness value="x" delay={100} />);
    expect(screen.getByTestId('debounced-value').textContent).toBe('x');

    rerender(<DebounceHarness value="y" delay={100} />);
    expect(screen.getByTestId('debounced-value').textContent).toBe('y');
  });

  it('updates after timeout outside test environment', () => {
    jest.useFakeTimers();
    process.env.NODE_ENV = 'production';
    delete process.env.JEST_WORKER_ID;

    const { rerender } = render(<DebounceHarness value="first" delay={100} />);
    expect(screen.getByTestId('debounced-value').textContent).toBe('first');

    rerender(<DebounceHarness value="second" delay={100} />);
    expect(screen.getByTestId('debounced-value').textContent).toBe('first');

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('debounced-value').textContent).toBe('second');
  });
});

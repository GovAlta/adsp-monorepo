import { useEffect } from 'react';

interface ShadowDomMutationProps {
  testId: string;
  elementSelector: string;
  attribute: string;
  value: string;
}

export const useShadowDomMutation = ({ testId, elementSelector, attribute, value }: ShadowDomMutationProps) => {
  useEffect(() => {
    const interval = setInterval(() => {
      const component = document.querySelector(`[testId="${testId}"]`);
      if (!component) return;
      const shadowRoot = component.shadowRoot;
      if (!shadowRoot) return;

      const element = shadowRoot.querySelector(elementSelector);
      if (element) {
        element.setAttribute(attribute, value);

        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [testId, elementSelector, attribute, value]);
};

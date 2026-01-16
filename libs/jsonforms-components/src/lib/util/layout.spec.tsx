import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LayoutRenderer, ReviewLayoutRenderer, renderLayoutElements } from './layout';
import { UISchemaElement } from '@jsonforms/core';

describe('Layout utilities', () => {
  describe('renderLayoutElements', () => {
    it('should return empty array when elements is empty', () => {
      const result = renderLayoutElements([]);
      expect(result).toEqual([]);
    });

    it('should render layout elements with all props', () => {
      const elements: UISchemaElement[] = [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ];

      const result = renderLayoutElements(elements, { type: 'object' }, 'test-path', true, [], []);

      expect(result).toHaveLength(1);
    });
  });

  describe('LayoutRenderer', () => {
    it('should return null when elements is empty', () => {
      const { container } = render(
        <LayoutRenderer
          elements={[]}
          schema={{}}
          path="test"
          enabled={true}
          direction="column"
          renderers={[]}
          cells={[]}
          visible={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render with column direction', () => {
      const elements: UISchemaElement[] = [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ];

      const { container } = render(
        <LayoutRenderer
          elements={elements}
          schema={{}}
          path="test"
          enabled={true}
          direction="column"
          renderers={[]}
          cells={[]}
          visible={true}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should render with row direction', () => {
      const elements: UISchemaElement[] = [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ];

      const { container } = render(
        <LayoutRenderer
          elements={elements}
          schema={{}}
          path="test"
          enabled={true}
          direction="row"
          renderers={[]}
          cells={[]}
          visible={true}
          width="20ch"
        />
      );

      expect(container).toBeTruthy();
    });

    it('should render with hidden visibility', () => {
      const elements: UISchemaElement[] = [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ];

      const { container } = render(
        <LayoutRenderer
          elements={elements}
          schema={{}}
          path="test"
          enabled={true}
          direction="column"
          renderers={[]}
          cells={[]}
          visible={false}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('ReviewLayoutRenderer', () => {
    it('should return null when elements is empty', () => {
      const { container } = render(
        <ReviewLayoutRenderer
          elements={[]}
          schema={{}}
          path="test"
          enabled={true}
          direction="column"
          renderers={[]}
          cells={[]}
          visible={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render with column direction', () => {
      const elements: UISchemaElement[] = [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ];

      const { container } = render(
        <ReviewLayoutRenderer
          elements={elements}
          schema={{}}
          path="test"
          enabled={true}
          direction="column"
          renderers={[]}
          cells={[]}
          visible={true}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should render with row direction', () => {
      const elements: UISchemaElement[] = [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ];

      const { container } = render(
        <ReviewLayoutRenderer
          elements={elements}
          schema={{}}
          path="test"
          enabled={true}
          direction="row"
          renderers={[]}
          cells={[]}
          visible={true}
          width="15ch"
        />
      );

      expect(container).toBeTruthy();
    });

    it('should render disabled state', () => {
      const elements: UISchemaElement[] = [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ];

      const { container } = render(
        <ReviewLayoutRenderer
          elements={elements}
          schema={{}}
          path="test"
          enabled={false}
          direction="column"
          renderers={[]}
          cells={[]}
          visible={true}
        />
      );

      expect(container).toBeTruthy();
    });
  });
});

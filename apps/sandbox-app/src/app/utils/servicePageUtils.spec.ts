import { addJsonformsPages, addFeedbackServicePages, addDesignSystemPages } from './servicePageUtils';
import { ServicePage } from '../components/services/ServiceListTemplate';

describe('servicePageUtils', () => {
  describe('addJsonformsPages', () => {
    test('returns the correct JSONForms pages for a given tenant', () => {
      // Arrange
      const tenantName = 'testTenant';

      // Act
      const result = addJsonformsPages(tenantName);

      // Assert
      expect(result).toEqual<ServicePage[]>([
        {
          id: 'jsonformsExample1',
          name: 'Jsonforms Example 1',
          url: '/testTenant/services/jsonforms/example1/control-examples',
          testId: 'jsonformsExample1',
        },
      ]);
    });

    test('returns an empty array when tenantName is an empty string', () => {
      // Arrange
      // clean-code-ignore: 2.14
      const tenantName = '';

      // Act
      const result = addJsonformsPages(tenantName);

      // Assert
      expect(result).toEqual<ServicePage[]>([
        {
          id: 'jsonformsExample1',
          name: 'Jsonforms Example 1',
          url: '//services/jsonforms/example1/control-examples',
          testId: 'jsonformsExample1',
        },
      ]);
    });
  });

  describe('addFeedbackServicePages', () => {
    test('returns the correct Feedback Service pages for a given tenant', () => {
      // Arrange
      const tenantName = 'testTenant';

      // Act
      const result = addFeedbackServicePages(tenantName);

      // Assert
      expect(result).toEqual<ServicePage[]>([
        {
          id: 'feedbackCSSLeak',
          name: 'Feedback css leak',
          url: '/testTenant/services/feedback/cssLeak',
          testId: 'feedbackCSSLeak',
        },
      ]);
    });

    test('returns an empty array when tenantName is an empty string', () => {
      // Arrange
      // clean-code-ignore: 2.14
      const tenantName = '';

      // Act
      const result = addFeedbackServicePages(tenantName);

      // Assert
      expect(result).toEqual<ServicePage[]>([
        {
          id: 'feedbackCSSLeak',
          name: 'Feedback css leak',
          url: '//services/feedback/cssLeak',
          testId: 'feedbackCSSLeak',
        },
      ]);
    });
  });

  describe('addDesignSystemPages', () => {
    test('returns the correct Design System pages for a given tenant', () => {
      // Arrange
      const tenantName = 'testTenant';

      // Act
      const result = addDesignSystemPages(tenantName);

      // Assert
      expect(result).toEqual<ServicePage[]>([
        {
          id: 'designSystemsExample1',
          name: 'Design systems Example 1',
          url: '/testTenant/services/design-systems/example1',
          testId: 'designSystemsExample1',
        },
      ]);
    });

    test('returns an empty array when tenantName is an empty string', () => {
      // Arrange
      // clean-code-ignore: 2.14
      const tenantName = '';

      // Act
      const result = addDesignSystemPages(tenantName);

      // Assert
      expect(result).toEqual<ServicePage[]>([
        {
          id: 'designSystemsExample1',
          name: 'Design systems Example 1',
          url: '//services/design-systems/example1',
          testId: 'designSystemsExample1',
        },
      ]);
    });
  });
});

import { ServicePage } from '../components/services/ServiceListTemplate';

export const addJsonformsPages = (tenantName: string) => {
  const prefix = `/${tenantName}/services/jsonforms`;
  const jsonformsPages: ServicePage[] = [
    {
      id: 'jsonformsExample1',
      name: 'Jsonforms Example 1',
      url: `${prefix}/example1/control-examples`,
      testId: 'jsonformsExample1',
    },
    {
      id: 'jsonformsExample1',
      name: 'Jsonforms Example 2',
      url: `${prefix}/example2`,
      testId: 'jsonformsExample2',
    },
  ];

  return jsonformsPages;
};

export const addFeedbackServicePages = (tenantName: string) => {
  const prefix = `/${tenantName}/services/feedback`;
  const feedbackPages: ServicePage[] = [
    {
      id: 'feedbackCSSLeak',
      name: 'Feedback overlay',
      url: `${prefix}/cssLeak`,
      testId: 'feedbackCSSLeak',
    },
  ];

  return feedbackPages;
};

export const addDesignSystemPages = (tenantName: string) => {
  const prefix = `/${tenantName}/services/design-systems`;
  const jsonformsPages: ServicePage[] = [
    {
      id: 'designSystemsExample1',
      name: 'Design systems Example 1',
      url: `${prefix}/example1`,
      testId: 'designSystemsExample1',
    },
  ];

  return jsonformsPages;
};

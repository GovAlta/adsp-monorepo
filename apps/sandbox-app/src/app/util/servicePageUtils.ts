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
      id: 'feedbackOverlay',
      name: 'Feedback overlay',
      url: `${prefix}/overlay`,
      testId: 'feedbackOverlayLink',
    },
    {
      id: 'feedbackOverlay2',
      name: 'Feedback overlay2',
      url: `${prefix}/overlay`,
      testId: 'feedbackOverlayLink2',
    },
  ];

  return feedbackPages;
};

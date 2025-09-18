import React from 'react';
import { GapAdjustment, HyperLinkColor } from './styled-components';
import { ExternalLink } from '@components/icons/ExternalLink';
import SupportLinks from '@components/SupportLinks';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
interface AsideLinksProps {
  serviceName: string;
  noDocsLink?: boolean;
  feedbackTutorialLink?: boolean;
}

const AsideLinks = ({ serviceName, noDocsLink = false, feedbackTutorialLink }: AsideLinksProps): JSX.Element => {
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);

  const capitalizeFirstLetter = (str: string): string => {
    if (str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  const getDocsLink = () => {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=${
      serviceName === 'pdf' ? serviceName.toUpperCase() : capitalizeFirstLetter(serviceName)
    } service`;
  };
  const getSupportCodeLink = () => {
    if (serviceName.toLowerCase() === 'access') {
      return 'https://github.com/GovAlta/access-service';
    }
    return `https://github.com/GovAlta/adsp-monorepo/tree/main/apps/${serviceName}-service`;
  };
  return (
    <>
      <GapAdjustment>Helpful links</GapAdjustment>
      <HyperLinkColor>
        <ExternalLink testId="code-link" link={getSupportCodeLink()} text="See the code" />
      </HyperLinkColor>
      {!noDocsLink && (
        <HyperLinkColor>
          <ExternalLink link={getDocsLink()} testId="docs-link" text="Read the API docs" />
        </HyperLinkColor>
      )}
      {feedbackTutorialLink && (
        <HyperLinkColor>
          <ExternalLink
            testId="feedback-tutorial-link"
            link="https://govalta.github.io/adsp-monorepo/tutorials/feedback-service/collectingFeedback.html"
            text="Feedback service tutorial"
          />
        </HyperLinkColor>
      )}
      <SupportLinks />
    </>
  );
};

export default AsideLinks;

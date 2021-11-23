import { GoAHeader, GoAHeroBanner } from '@abgov/react-components';
import styled from 'styled-components';
import bannerBackground from '@assets/BannerBackground.jpg';
import { useEffect } from 'react';

const SubscriberPage = (): JSX.Element => {
  useEffect(() => {
    // do initial api calls
  }, []);
  return (
    <div>
      <GoAHeader
        serviceLevel="beta"
        serviceName="Alberta Digital Service Platform - subscriber page "
        serviceHome="/"
      />
      <GoAHeroBanner title="" backgroundUrl={bannerBackground}>
        <h1>The Alberta Digital Service Platform</h1>
        <p>
          Enabling you to add, configure, and manage a range of services that can integrate with your new or existing
          project. Quick to deploy, easy to manage and free to use.
        </p>
      </GoAHeroBanner>
      <main>yolo</main>
      <Footer>
        <a href="https://www.alberta.ca">Go to Alberta.ca</a>
        <FooterLinks>
          <a href="https://www.alberta.ca/disclaimer.aspx">Disclaimer</a>
          <a href="https://www.alberta.ca/privacystatement.aspx">Privacy</a>
          <a href="https://www.alberta.ca/accessibility.aspx">Accessibility</a>
        </FooterLinks>
        <FooterCopyright>&#169; 2021 Government of Alberta</FooterCopyright>
      </Footer>
    </div>
  );
};

const Footer = styled.div`
  padding-top: 20px;
  text-align: center;
  background-color: #f1f1f1;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  margin: 0 1rem;
  > * {
    display: inline-block;
    margin-right: 1rem;
    &:last-of-type {
      margin-right: 0;
    }
  }
`;

const FooterCopyright = styled.div`
  text-align: center;
  padding: 1rem;
`;

export default SubscriberPage;

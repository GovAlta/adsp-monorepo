import { FunctionComponent } from 'react';
import styled from 'styled-components';

interface FooterProps {
  logoSrc: string;
}

export const Footer: FunctionComponent<FooterProps> = ({ logoSrc }) => {
  return (
    <FooterContainer>
      <LinksLogoContainer>
        <FooterLinks>
          <a href="https://www.alberta.ca">Go to Alberta.ca</a>
          <a href="https://www.alberta.ca/disclaimer.aspx">Disclaimer</a>
          <a href="https://www.alberta.ca/privacystatement.aspx">Privacy</a>
          <a href="https://www.alberta.ca/accessibility.aspx">Accessibility</a>
        </FooterLinks>
        <img src={logoSrc} alt="Government of Alberta logo" />
      </LinksLogoContainer>
      <FooterCopyright>© {new Date().getFullYear()} Government of Alberta</FooterCopyright>
    </FooterContainer>
  );
};

const FooterCopyright = styled.div`
  text-align: right;
  padding: 1rem;
`;

const FooterContainer = styled.footer`
  background-color: var(--color-gray-100);
  padding-top: 2rem;
  padding-bottom: 2rem;
  padding-right: 10rem;
  padding-left: 10rem;
  border-bottom: 16px solid #0081a2;
`;

const LinksLogoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-gray-200);
  padding-bottom: 1rem;
`;

const FooterLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  max-width: 90%;
  justify-content: center;
  > * {
    margin-right: 1rem;
  }
  a:link {
    color: var(--black-100);
  }
  a:visited {
    color: var(--color-link-visited);
  }
`;

import styled from 'styled-components';
import { GoAButton } from '@abgov/react-components';
import { ReactComponent as OpenIcon } from '@assets/icons/open.svg';
import React from 'react';
// *****************
// Styled Components
// *****************

interface SectionProps {
  backgroundColor?: string;
}

export const Section = styled.div<SectionProps>`
  .h2 {
    padding-bottom: 10rem !important;
  }
  background-color: ${(props: SectionProps) => props.backgroundColor ?? 'transparent'};
`;

//display: ${(props: PagePros) => (props.ready === true || props.ready === undefined ? 'flex' : 'none')};

interface CardContentProps {
  maxHeight: number;
}

export const H2 = styled.h2`
  margin-bottom: 1.5rem !important;
`;
export const Paragraph = styled.p`
  margin-bottom: 1.5rem !important;
`;
export const CardContent = styled.div`
  line-height: 1.75em;
  min-height: ${(props: CardContentProps) => {
    const width = window.innerWidth;
    if (width < 768) {
      return 'initial';
    }
    return `${props.maxHeight}px`;
  }};
  margin-bottom: 1.75em;
`;
export const CardLayout = styled.div`
  padding-top: 0.75em;
  padding-bottom: 1.5em;
`;

export const BoldTitle = styled.h1`
  && {
    font-weight: var(--fw-bold);
  }
`;

export const GrayBox = styled.div`
  padding-top: 2.5em;
  background-color: var(--color-gray-100);
  padding-bottom: 2.5em;
`;

export const DashBoardImg = styled.img`
  box-shadow: 1px 5px 28px 0px #00000033;
`;

export const HeroBannerLayout = styled.div`
  .goa-hero {
    max-height: 20em !important;
    background-size: 100% 100%;
    padding: 0px !important;
  }
`;

export const ServiceLayout = styled.div`
  margin-top: 5rem;
`;

export const ServiceLayoutMin = styled.div`
  margin-top: 2rem;
`;

export const ClockImg = styled.img`
  margin-top: 1.5em;
  height: 130px;
  width: 130px !important;
`;

interface RedirectButtonProps {
  url: string;
  name: string;
  label: string;
}

//TODO: need to decide whether we need to move following to footer
export const ContentFootSeparator = styled.div`
  margin-bottom: 6rem;
`;

export const RedirectButton = ({ url, name, label }: RedirectButtonProps): JSX.Element => {
  const Content = styled.div`
    display: grid;
    grid-template-columns: 4fr 1fr;
    grid-gap: 4px;

    svg {
      width: 23px;
      height: 24px;
      position: relative;
      top: -4px;
      stroke: var(--color-primary);
    }
  `;
  const ButtonContainer = styled.div`
    :hover svg {
      stroke: var(--color-primary-dark);
    }
  `;
  return (
    <ButtonContainer>
      <GoAButton
        buttonType="tertiary"
        data-testid={`redirect-button-${name}`}
        onClick={() => {
          window.open(url, '_blank');
        }}
      >
        <Content>
          {label} <OpenIcon />
        </Content>
      </GoAButton>
    </ButtonContainer>
  );
};

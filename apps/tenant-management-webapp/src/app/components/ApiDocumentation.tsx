import React, { FunctionComponent } from 'react';
import { RedocStandalone } from 'redoc';
import styled from 'styled-components';

interface ApiDocumentationProps {
  specUrl: string;
  className?: string;
}

const ApiDocumentationComponent: FunctionComponent<ApiDocumentationProps> = ({ specUrl, className }) => {
  return (
    <div className={className}>
      <RedocStandalone
        specUrl={specUrl}
        options={{
          disableSearch: true,
          noAutoAuth: true,
          hideLoading: true,
          jsonSampleExpandLevel: 0,
          payloadSampleIdx: 0,
          theme: {
            colors: {
              tonalOffset: 0.1,
            },
            spacing: {
              unit: 2,
              sectionVertical: 16,
              sectionHorizontal: 16,
            },
            typography: {
              fontFamily: 'inherit',
              fontSize: '18px',
              lineHeight: '28px',
              fontWeightLight: '300',
              headings: { fontFamily: 'inherit', fontWeight: '400' },
            },
            breakpoints: { small: '0rem', medium: '100000rem', large: '100000rem' },
            sidebar: { width: '0' },
            rightPanel: { width: '0' },
          },
        }}
      />
    </div>
  );
};

export const ApiDocumentation = styled(ApiDocumentationComponent)`
  & .menu-content {
    display: none;
  }
`;

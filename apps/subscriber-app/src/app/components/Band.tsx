import React, { ReactNode } from 'react';
import { Grid, GridItem } from '@components/Grid';
import Container from '@components/Container';
import styled from 'styled-components';

interface BandProps {
  title?: string;
  children?: ReactNode;
}
export function Band({ title, children }: BandProps): JSX.Element {
  return (
    <div
      style={{
        background: '#0081A2',
        borderBottom: '8px solid #C8EEFA',
      }}
    >
      <HeroBannerLayout>
        <Container style={{ padding: '56px 0 56px 0' }} hs={1} vs={3}>
          <Grid>
            <GridItem md={1} />
            <GridItem md={10}>
              <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'white', marginBottom: '28px' }}>{title}</h1>
              <div style={{ fontSize: '24px', fontWeight: 400, color: 'white' }}>{children}</div>
            </GridItem>
            <GridItem md={1} />
          </Grid>
        </Container>
      </HeroBannerLayout>
    </div>
  );
}

const HeroBannerLayout = styled.div`
  .goa-hero {
    max-height: 15em !important;
    background-size: 100% 100%;
    padding: 0px !important;
  }
`;

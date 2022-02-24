import React, { ReactNode } from 'react';
import { Grid, GridItem } from '@components/Grid';
import Container from '@components/Container';

interface BandProps {
  title?: string;
  children?: ReactNode;
}
export function Band({ title, children }: BandProps): JSX.Element {
  return (
    <div
      style={{
        background: '#0081A2',
      }}
    >
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
    </div>
  );
}

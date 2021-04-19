import React from 'react';
import { GoACard } from '@abgov/react-components';
import ProductFeatures from '@assets/ProductFeatures.png';
import { Grid, GridItem } from '@components/Grid';
import { Main } from '@components/Html';

const Dashboard = () => {
  return (
    <Main>
      <h1>Dashboard</h1>
      <p>
        Cases of COVID-19 continue to rise in Alberta. All Albertans must continue to follow all public health measures
        to help bend the curve and protect the health-care system.
      </p>

      <Grid>
        <GridItem md={6} vSpacing={1} hSpacing={0.5}>
          <GoACard
            title="SMS Messages"
            description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
            cardImageUrl={ProductFeatures}
          />
        </GridItem>
        <GridItem md={6} vSpacing={1} hSpacing={0.5}>
          <GoACard
            title="Emails"
            description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
            cardImageUrl={ProductFeatures}
          />
        </GridItem>
      </Grid>
    </Main>
  );
};
export default Dashboard;

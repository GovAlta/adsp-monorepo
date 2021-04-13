import React from 'react';
import { GoACard } from '@abgov/react-components';
import ProductFeatures from '@assets/ProductFeatures.png';
import { Grid, GridItem } from '@components/_/Grid';
const Dashboard = () => {
  return (
    <>
      <h2>Dashboard</h2>
      <p>
        Cases of COVID-19 continue to rise in Alberta. All Albertans must continue to follow all public health measures
        to help bend the curve and protect the health-care system.
      </p>

      <Grid>
        <GridItem md={6}>
          <GoACard
            title="SMS Messages"
            description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
            titleUrl="https://www.alberta.ca/"
            cardImageUrl={ProductFeatures}
          />
        </GridItem>
        <GridItem md={6}>
          <GoACard
            title="Emails"
            description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
            titleUrl="https://www.alberta.ca/"
            cardImageUrl={ProductFeatures}
          />
        </GridItem>
      </Grid>
    </>
  );
};
export default Dashboard;

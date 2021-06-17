import React from 'react';
import { GoACard } from '@abgov/react-components';
import { Link } from 'react-router-dom';
import ProductFeatures from '@assets/ProductFeatures.png';
import { Grid, GridItem } from '@components/Grid';
import { Main } from '@components/Html';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

const Dashboard = () => {
  const tenantName = useSelector((state: RootState) => state.tenant.name);

  return (
    <Main>
      <h2>{tenantName} Dashboard</h2>
      <Grid>
        <GridItem xl={8} lg={8} vSpacing={1} hSpacing={0.5}>
          <Grid>
            <GridItem md={6} vSpacing={1} hSpacing={0.5}>
              <GoACard
                title={<Link to="/admin/tenant-admin/access">Access</Link>}
                description="Access allows you to add a secure sign in to you application and services with minimum effort and configuration. No need to deal with storing or authenticating users. It's all available out of the box."
              />
            </GridItem>
            <GridItem md={6} vSpacing={1} hSpacing={0.5}>
              <GoACard
                title={<Link to="/admin/tenant-admin/services/file">File Service</Link>}
                description="The file service provides the capability to upload and download files. Consumers are registered with their own space (tenant) containing file types that include role based access policy, and can associate files to domain records."
              />
            </GridItem>
            <GridItem md={6} vSpacing={1} hSpacing={0.5}>
              <GoACard
                title={<Link to="/admin/tenant-admin/services/service-status">Status</Link>}
                description="This service allows for easy monitoring of application downtime. Each Application should represent a service that is useful to the end user by itself, such as child care subsidy and child care certification."
              />
            </GridItem>
          </Grid>
        </GridItem>
        <GridItem xl={4} lg={4} vSpacing={1} style={{ padding: '0 2em 0 4em' }}>
          This service is in <b>BETA</b> release. If you have any questions, please email{' '}
          <a href="mailto: DIO@gov.ab.ca">DIO@gov.ab.ca</a>
        </GridItem>
      </Grid>
    </Main>
  );
};
export default Dashboard;

import React from 'react';
import { GoACard, GoACardGroup } from '@abgov/react-components';
import ProductFeatures from '../../../../assets/ProductFeatures.png';

const Dashboard = () => {
  return (
    <div id="dashboard">
      <div>
        <GoACardGroup title={'Dashboard'} layout="basic">
          <GoACard
            title="SMS Messages"
            description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
            titleUrl="https://www.alberta.ca/"
            cardWidth={400}
            cardImageUrl={ProductFeatures}
          />
          <GoACard
            title="Emails"
            description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
            titleUrl="https://www.alberta.ca/"
            cardWidth={400}
            cardImageUrl={ProductFeatures}
          />
        </GoACardGroup>
      </div>
      <h2 className="mb-3">Recent Activity</h2>
      <p>
        Cases of COVID-19 continue to rise in Alberta. All Albertans must
        continue to follow all public health measures to help bend the curve and
        protect the health-care system.
      </p>
    </div>
  );
};

export default Dashboard;

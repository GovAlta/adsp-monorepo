import React from 'react';
import { GoACard, GoACardGroup } from '@abgov/react-components';
import person from '../../../../assets/person.jpg';

const Dashboard = () => {
  return (
    <div>
      <GoACardGroup title={'Dashboard'} layout="basic">
        <GoACard
          title="SMS Messages"
          description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
          titleUrl="https://www.alberta.ca/"
          cardWidth={400}
          cardImageUrl={person}
        />
        <GoACard
          title="Emails"
          description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
          titleUrl="https://www.alberta.ca/"
          cardWidth={400}
          cardImageUrl={person}
        />
      </GoACardGroup>
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

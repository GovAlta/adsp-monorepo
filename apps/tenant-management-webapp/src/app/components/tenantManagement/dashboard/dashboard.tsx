import React from 'react';
import { GoACard } from '@abgov/react-components';
import ProductFeatures from '../../../../assets/ProductFeatures.png';
import { Container, Row, Col } from 'react-bootstrap';
const Dashboard = () => {
  return (
    <div id="dashboard">
      <Container>
        <h2 className="mb-3">Dashboard</h2>
        <Row className="mb-5 mt-5">
          <Col xs={12} sm={6} md={6} lg={4} className="mb-3 mt-3">
            <GoACard
              title="SMS Messages"
              description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
              titleUrl="https://www.alberta.ca/"
              cardImageUrl={ProductFeatures}
            />
          </Col>
          <Col xs={12} sm={6} md={6} lg={4} className="mb-3 mt-3">
            <GoACard
              title="Emails"
              description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
              titleUrl="https://www.alberta.ca/"
              cardImageUrl={ProductFeatures}
            />
          </Col>
          <Col xs={12} sm={6} md={6} lg={4} className="mb-3 mt-3">
            <GoACard
              title="Emails"
              description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
              titleUrl="https://www.alberta.ca/"
              cardImageUrl={ProductFeatures}
            />
          </Col>
          <Col xs={12} sm={6} md={6} lg={4} className="mb-3 mt-3">
            <GoACard
              title="Emails"
              description="We are encouraging companies to turn out oil ad gas resources into more valuable products-creating good jobs for Albertans."
              titleUrl="https://www.alberta.ca/"
              cardImageUrl={ProductFeatures}
            />
          </Col>
        </Row>

        <h2 className="mb-3">Recent Activity</h2>
        <p>
          Cases of COVID-19 continue to rise in Alberta. All Albertans must
          continue to follow all public health measures to help bend the curve
          and protect the health-care system.
        </p>
      </Container>
    </div>
  );
};
export default Dashboard;

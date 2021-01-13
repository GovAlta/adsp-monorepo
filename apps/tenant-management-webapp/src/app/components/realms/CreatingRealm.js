import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';
import Carousel from 'react-bootstrap/Carousel';
import { GoAButton } from '@abgov/react-components';
import { faArrowCircleRight } from '@fortawesome/free-solid-svg-icons';
import { faArrowCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import CreatingRealmCarousel0 from './img/creatingRealmCarousel0.png';
import CreatingRealmCarousel1 from './img/creatingRealmCarousel1.png';
import white from './img/white.png';
import Header from '../../header';
import './CreatingRealm.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'react-bootstrap-carousel/dist/react-bootstrap-carousel.css';

function CreatingRealm(props) {
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [index, setIndex] = useState(0);

  const handleSelect = (selectedIndex, e) => {
    setIndex(selectedIndex);
  };

  const onCreateRealm = async () => {
    const url = '/createRealm?realm=' + name;
    console.log('url = ' + url);
    const res = await axios.get(url);

    console.log(res.data.Msg);
    alert(res.data.Msg);
  };

  const backToMain = () => {
    props.history.push('/realms');
  };

  const onChangeName = (event) => {
    setName(event.target.value);
  };

  return (
    <div>
      <Header url={'/'} urlName="Home" serviceName="" />
      <Container className="signin-body mt-5">
        <div className="signin-title mb-5">
          <Col xs={12} md={{ size: 12 }}>
            <h1 style={{ fontWeight: 'bold' }}>
              Currently creating your tenant.
            </h1>
            <div className="mb-5">
              This should not take long, please explore our features while you
              wait.
            </div>
          </Col>
          <Col
            sx={12}
            md={{ size: 8, offset: 2 }}
            style={{
              padding: '40px 0 30px 0',
              borderStyle: 'solid',
              borderColor: 'grey',
              borderWidth: '1px',
              boxShadow: '1px 2px #888888',
            }}
          >
            <Carousel
              interval={null}
              activeIndex={index}
              onSelect={handleSelect}
              nextIcon={
                <FontAwesomeIcon
                  className="leftCarouselIcon"
                  icon={faArrowCircleRight}
                />
              }
              prevIcon={
                <FontAwesomeIcon
                  className="rightCarouselIcon"
                  icon={faArrowCircleLeft}
                />
              }
            >
              <Carousel.Item className="smallScreenCarouselAddPadding">
                <div>
                  <img
                    src={CreatingRealmCarousel0}
                    style={{ width: '50%' }}
                  ></img>
                </div>
                <img
                  src={white}
                  style={{ width: '100%', height: '339px' }}
                ></img>

                <Carousel.Caption>
                  <h3 style={{ fontWeight: 'bold', textAlign: 'left' }}>
                    Introducing our Access Service
                  </h3>
                  <p
                    style={{
                      color: '#000',
                      marginBottom: '20px',
                      textAlign: 'left',
                    }}
                  >
                    Quickly provide your project with a secure, robust and easy
                    to use authentication system that supports Government of
                    Alberta, Microsoft and Google credentials out of the box
                  </p>
                </Carousel.Caption>
              </Carousel.Item>
              <Carousel.Item>
                <div>
                  <img
                    src={CreatingRealmCarousel1}
                    style={{ width: '40%' }}
                  ></img>
                </div>
                <img
                  src={white}
                  style={{ width: '100%', height: '277px' }}
                ></img>

                <Carousel.Caption>
                  <h3 style={{ fontWeight: 'bold', textAlign: 'left' }}>
                    Update your users
                  </h3>
                  <p
                    style={{
                      color: '#000',
                      marginBottom: '20px',
                      textAlign: 'left',
                    }}
                  >
                    Through our notification service, we make it easy to send
                    personalized messages from a single template, for SMS or
                    email. You do not need technical knowledge to use it. Yay!
                  </p>
                </Carousel.Caption>
              </Carousel.Item>
            </Carousel>
          </Col>
        </div>
      </Container>
    </div>
  );
}

export default CreatingRealm;

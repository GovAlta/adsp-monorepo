import React, { Component } from 'react';
import { withRouter } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap';
import { GoAButton } from '@abgov/react-components';
import Tools from './img/tools.png';
import axios from 'axios';
import Header from '../../header';

import './SignIn.css';

class CreateErrorPage extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            errorMsg:''
        };
    }

    onCreateRealm= async ()=> {
        this.props.history.push('/realms/creatingRealm')
    }

    backToMain = () => {
        this.props.history.push('/realms')
    }

    onChangeName=(event)=> {
        this.setState({ name: event.target.value });
    }


    onAddClientRole= async ()=> {
        let url = "/addClientRoleMapping?realm=" + this.state.name + "&email=" + this.state.email;
        console.log("url = " + url);
        const res = await axios.get(url);
        console.log(res.data.Msg)
        alert(res.data.Msg);
    }

    render() {
        return (
            <div>
              <Header url={'/'} urlName="Home" serviceName="" />
              <Container className="signin-body mt-5">
                  <div style={{textAlign: 'center'}}>
                      <div className="mb-5">
                          <img src={Tools} style={{width: '125px'}}></img>
                      </div>
                      <div className="signin-title mb-5">
                          <h1 style={{fontWeight: 'bold'}}>Unfortunately, there was an activation error.</h1>
                      </div>
                      <Col md={{ size: 8, offset: 2 }}>
                          <div className="mb-5" style={{fontSize: '23px'}}>We appologize for the inconvenience, but we could not successfully activate your tenant. Please try again.</div>
                      </Col>
                      <div style={{margin: '35px 0 0 11px'}}><GoAButton onClick={this.onAddClientRole}>Activate Tenant</GoAButton></div>
                  </div>
              </Container>
            </div>
        );
    }
}

export default CreateErrorPage;

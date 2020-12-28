import React, { Component } from 'react';
import { withRouter } from 'react-router-dom'
import { Container, Row, Col } from 'reactstrap';
import { GoAButton } from '@abgov/react-components';
import axios from 'axios';
import './SignIn.css';
import Header from '../../header';


class AddClientRole extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            email:'',
            errorMsg:''
        };
    }


    onAddClientRole= async ()=> {
        let url = "/addClientRoleMapping?realm=" + this.state.name + "&email=" + this.state.email;
        console.log("url = " + url);
        const res = await axios.get(url);
        console.log(res.data.Msg)
        alert(res.data.Msg);
    }

    backToMain = () => {
        this.props.history.push('/realms')
    }

    onChangeName=(event)=> {
        this.setState({ name: event.target.value });
        //this.setState({ errorMsg: '' });
    }
    onChangeEmail=(event)=> {
        this.setState({ email: event.target.value });
        //this.setState({ errorMsg: '' });
    }
    render() {
        return (
            <div>
              <Header url={'/'} urlName="Home" serviceName="" />
              <Container className="signin-body mt-5">
                  <Row>
                      <Col lg={{ size: 6, offset: 3}} md={{ size: 8, offset: 2 }} style={{padding: '51px', borderStyle: 'solid', borderColor: 'grey', borderWidth: '1px', boxShadow: '1px 2px #888888', height: '100%', margin: '0 8px 0 8px'}}>
                          <div className="signin-title mb-5">
                              <h1 style={{fontWeight: 'bold', textAlign: 'left'}}>Activate tenant</h1>
                          </div>
                          <div className="mb-5">If your tenant creation has been successful, you will have received a confirmation email. Please refer to your email for the tenant's name.</div>

                          <label for="fname" className="siginin-small-title">Tenant Name</label>
                          <input className="signin-input" Value={this.state.name} errorMessage={this.state.errorMsg} onChange={this.onChangeName} />
                          <div className="siginin-subset">Names cannot container special characters (ex. ! % &)</div>
                          <label for="fname" className="siginin-small-title">Email</label>
                          <input className="signin-input" Value={this.state.email} errorMessage={this.state.errorMsg} onChange={this.onChangeEmail} />
                          <div style={{display: 'flex', flexDirection: 'row'}}>
                          <div style={{margin: '35px 11px 0 0'}}><GoAButton onClick={this.backToMain} buttonType="secondary">Back</GoAButton></div>
                          <div style={{margin: '35px 0 0 11px'}}><GoAButton onClick={this.onAddClientRole}>Activate Tenant</GoAButton></div>
                          </div>
                          <div className='mt-5'>
                              Need to create tenant? <a href={'/realms/CreateRealm'}>Create Tenant</a>
                          </div>
                      </Col>
                  </Row>
              </Container>
            </div>
        );
    }
}

export default AddClientRole;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="cypress" />
const steps_1 = require("cypress-cucumber-preprocessor/steps");
//declare const Given, When, Then;
steps_1.Given(/^I am a user$/, () => {
});
steps_1.When(/^I do something$/, () => {
});
steps_1.Then(/^I get something$/, () => {
    cy.request('GET', 'https://tenant-management-api-core-services-dev.os99.gov.ab.ca/health').then(function (response) {
        expect(response.status).to.eq(200);
        expect(response.body, 'response body').to.have.property('uptime');
    });
});

/// <reference types="cypress" />
import {
  Before,
  After,
  Given,
  When,
  Then,
} from 'cypress-cucumber-preprocessor/steps';

Given(/^e2e we want a simple pass$/, function () {
  expect(1).to.eq(1);
});

When(/^e2e we are testing cicd$/, function () {
  expect(1).to.eq(1);
});

Then(/^e2e it should pass$/, function () {
  expect(1).to.eq(1);
});

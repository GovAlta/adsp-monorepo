/// <reference types="cypress" />
import {
	Before,
	After,
	Given,
	When,
	Then,
} from "cypress-cucumber-preprocessor/steps";

Given(/^e2e we want a simple pass$/, function () {});

When(/^e2e we are testing cicd$/, function () {});

Then(/^e2e it should pass$/, function () {
	expect(1).to.eq(1);
});

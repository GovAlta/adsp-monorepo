import {
	Before,
	After,
	Given,
	When,
	Then,
} from "cypress-cucumber-preprocessor/steps";

Given('We want a simple pass', function () {});

When('We are testing cicd', function () {});

Then('it should pass', function () {
	expect(1).to.eq(1);	
});

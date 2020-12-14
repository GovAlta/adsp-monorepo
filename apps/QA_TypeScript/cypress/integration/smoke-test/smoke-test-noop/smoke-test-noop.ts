import {
	Before,
	After,
	Given,
	When,
	Then,
} from "cypress-cucumber-preprocessor/steps";

Given('smk we want a simple pass', function () {});

When('smk we are testing cicd', function () {});

Then('smk it should pass', function () {
	expect(1).to.eq(1);	
});

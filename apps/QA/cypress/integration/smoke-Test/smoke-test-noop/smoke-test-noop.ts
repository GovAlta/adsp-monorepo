import {
  Before,
  After,
  Given,
  When,
  Then,
} from 'cypress-cucumber-preprocessor/steps';

Given('We want a simple pass', function () {
  expect(1).to.eq(1);
});

When('We are testing cicd', function () {
  expect(1).to.eq(1);
});

Then('it should pass', function () {
  expect(1).to.eq(1);
});

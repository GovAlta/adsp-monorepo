import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import commonlib from '../common/common-library';
import CachePage from './cache.page';

const cacheObj = new CachePage();

Then('the user views {string} section on cache overview page', function (sectionName) {
  cacheObj.cacheOverviewTab().should('exist');
  cacheObj
    .cacheOverviewCachetargetsContent(sectionName)
    .invoke('text')
    .should(
      'contain',
      'Targets are upstream services and APIs that cache service can provide read-through requests to. This configuration is'
    );
});

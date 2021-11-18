import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import commonlib from '../common/common-library';
import common from '../common/common.page';
import notificationsPage from './notifications.page';

const commonObj = new common();
const notificationsObj = new notificationsPage();

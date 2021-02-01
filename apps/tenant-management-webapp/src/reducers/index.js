import { combineReducers } from 'redux';
import TenantManagementReducer from './tenantmanagementreducer';


export default combineReducers({
	tenantManagement: TenantManagementReducer
});

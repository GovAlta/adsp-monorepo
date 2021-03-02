import { TenantAPI } from '../reducers/config.contract'
import { User } from '../reducers/user.contract'
import { FetchAccessAction } from './types'


export const fetchAccess = (user: User, tenant: TenantAPI): FetchAccessAction => ({
  type: 'tenant/access/FETCH_ACCESSINFO',
  payload: {
    user,
    tenant,
  }
})

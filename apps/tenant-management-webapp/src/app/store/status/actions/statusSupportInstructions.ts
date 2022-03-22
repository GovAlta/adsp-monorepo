import { ContactInformation, StatusConfigurationInfo } from '../models';

export const UPDATE_STATUS_CONTACT_INFORMATION = 'status/UPDATE_STATUS_CONTACT_INFORMATION';
export const FETCH_STATUS_CONFIGURATION = 'status/FETCH_STATUS_CONFIGURATION';
export const FETCH_STATUS_CONFIGURATION_SUCCEEDED = 'status/FETCH_STATUS_CONFIGURATION_SUCCEEDED';

export interface FetchNotificationConfigurationAction {
  type: typeof FETCH_STATUS_CONFIGURATION;
}

export interface FetchNotificationConfigurationSucceededAction {
  type: typeof FETCH_STATUS_CONFIGURATION_SUCCEEDED;
  payload: StatusConfigurationInfo;
}

export interface UpdateStatusContactInformationAction {
  type: typeof UPDATE_STATUS_CONTACT_INFORMATION;
  payload: ContactInformation;
}

export const UpdateContactInformationService = (
  contactInformation: ContactInformation
): UpdateStatusContactInformationAction => ({
  type: UPDATE_STATUS_CONTACT_INFORMATION,
  payload: contactInformation,
});

export const FetchStatusConfigurationSucceededService = (
  statusConfigurationInfo: StatusConfigurationInfo
): FetchNotificationConfigurationSucceededAction => ({
  type: FETCH_STATUS_CONFIGURATION_SUCCEEDED,
  payload: statusConfigurationInfo,
});

export const FetchStatusConfigurationService = (): FetchNotificationConfigurationAction => ({
  type: FETCH_STATUS_CONFIGURATION,
});

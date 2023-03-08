import axios from 'axios';
import { store } from '../../../../../store/index';

export async function getSubcriberSubscriptions(subscriberId: string): Promise<string[]> {
  const configBaseUrl: string = store.getState().config.serviceUrls?.notificationServiceUrl;
  const token: string = store.getState().session.credentials.token;
  const findSubscriberPath = `subscription/v1/subscribers/${subscriberId}/subscriptions?top=100`;
  if (configBaseUrl && token) {
    const apiCall = await axios.get(`${configBaseUrl}/${findSubscriberPath}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: string[] = apiCall.data.results.map((item) => {
      return item.typeId;
    });
    return data;
  }
}

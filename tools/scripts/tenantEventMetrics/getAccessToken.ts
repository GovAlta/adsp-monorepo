import axios from 'axios';
import * as querystring from 'querystring';

export async function getAccessToken(accessServiceUrl: URL, clientId: string, clientSecret: string): Promise<string> {
  const params = querystring.stringify({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const {
    data: { access_token },
  } = await axios.post<{ access_token: string }>(
    new URL('/auth/realms/core/protocol/openid-connect/token', accessServiceUrl).href,
    params,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  return access_token;
}

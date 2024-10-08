import { RequestHandler, Router } from 'express';
import axios from 'axios';
import { Logger } from 'winston';

interface AddressResponse {
  suggestions: Array<{
    Id: string;
    Text: string;
    Highlight: string;
    Cursor: number;
    Description: string;
    Next: string;
  }>;
}
// Cache for storing token and its expiration time
let cachedToken: string | null = null;
let tokenExpirationTime: number | null = null;

/**
 * Function to get address validation token using client credentials grant type.
 * @param address_client_id - Client ID for the address service.
 * @param address_client_secret - Client Secret for the address service.
 * @param address_access_token_url - The URL to obtain the access token.
 * @returns A promise that resolves to an access token string.
 */

export async function getAddressValidationToken(
  address_client_id: string,
  address_client_secret: string,
  address_access_token_url: string,
  logger: Logger
): Promise<{ token: string; expires_in: number }> {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', address_client_id);
    params.append('client_secret', address_client_secret);

    const { data } = await axios.post(address_access_token_url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    logger.info(`Fetched address validation token`, {
      expires_in: data.expires_in,
    });

    return {
      token: data.access_token,
      expires_in: data.expires_in,
    };
  } catch (error) {
    logger.error('Error fetching address validation token:', error.message);
    throw error;
  }
}

/**
 * Function to get a valid token, either from the cache or by requesting a new one.
 */
export async function getValidToken(environment, logger: Logger): Promise<string> {
  const currentTime = Date.now();
  const address_client_id = environment.ADDRESS_TOKEN_CLIENT_ID;
  const address_client_secret = environment.ADDRESS_TOKEN_CLIENT_SECRET;
  const address_access_token_url = environment.ADDRESS_TOKEN_URL;
  // If token is cached and has not expired, return the cached token
  if (cachedToken && tokenExpirationTime && currentTime < tokenExpirationTime) {
    return cachedToken;
  }

  // Otherwise, get a new token
  try {
    const { token, expires_in } = await getAddressValidationToken(
      address_client_id,
      address_client_secret,
      address_access_token_url,
      logger
    );

    // Cache the token and set the expiration time
    cachedToken = token;
    tokenExpirationTime = currentTime + expires_in * 1000; // expires_in is usually in seconds

    return cachedToken;
  } catch (error) {
    logger.error('Failed to obtain a valid token:', error.message);
    throw new Error('Error in token retrieval');
  }
}

export function findAddress({ environment, logger }): RequestHandler {
  return async (req, _res, next) => {
    const address_url = environment.ADDRESS_URL;
    const token = await getValidToken(environment, logger);

    try {
      const { country, languagePreference, lastId, maxSuggestions, searchTerm } = req.query;
      const params = new URLSearchParams({
        country: country ? country.toString() : 'CAN',
        languagePreference: languagePreference ? languagePreference.toString() : 'en',
        lastId: lastId ? lastId.toString() : '',
        maxSuggestions: maxSuggestions ? maxSuggestions.toString() : `${5}`,
        searchTerm: searchTerm ? searchTerm.toString() : '',
      });

      const { data } = await axios.get<AddressResponse>(`${address_url}find?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      logger.info(`Fetched address list for ${searchTerm}`);

      _res.send(data);
    } catch (error) {
      logger.error('There was an error in the request to address validation API', error);
      next(error);
    }
  };
}

export const createAddressRouter = ({ environment, logger }): Router => {
  const router = Router();

  router.get('/find', findAddress({ environment, logger }));

  return router;
};

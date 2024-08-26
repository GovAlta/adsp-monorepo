import { ServiceDirectory, TokenProvider, User, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Request } from 'express';
import { Strategy } from 'passport';

const FORM_API_ID = adspId`urn:ads:platform:form-service:v1`;

/**
 * Strategy that authenticates via verify code based access to form data.
 *
 * @export
 * @class FormStrategy
 * @extends {Strategy}
 */
export class FormStrategy extends Strategy {
  public name: 'form';

  constructor(private directory: ServiceDirectory, private tokenProvider: TokenProvider) {
    super();
  }

  override authenticate = async (req: Request) => {
    try {
      const { code } = req.query;
      if (code) {
        const formApiUrl = await this.directory.getServiceUrl(FORM_API_ID);
        const { formId } = req.params;
        const formAccessUrl = new URL(`v1/forms/${formId}/data`, formApiUrl);

        const token = await this.tokenProvider.getAccessToken();
        const { data } = await axios.get<{ data: Record<string, unknown>; files: Record<string, string> }>(
          formAccessUrl.href,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { code },
          }
        );

        this.success({ anonymous: true, formId } as unknown as User, data);
      } else {
        this.pass();
      }
    } catch (err) {
      this.fail();
    }
  };
}

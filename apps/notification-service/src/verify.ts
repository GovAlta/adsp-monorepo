import { adspId, Channel, ServiceDirectory, Template, TokenProvider } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import axios from 'axios';
import { readFile } from 'fs';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import { Providers, SubscriberChannel, TemplateService } from './notification';

export interface VerifyService {
  sendCode(channel: SubscriberChannel, reason: string): Promise<string>;
  verifyCode(channel: SubscriberChannel, code: string): Promise<boolean>;
}

class VerifyServiceImpl implements VerifyService {
  private templates: Partial<Record<Channel, Template>> = {};

  constructor(
    private providers: Providers,
    private templateService: TemplateService,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider
  ) {
    Object.keys(providers).forEach((channel: Channel) => {
      readFile(`${__dirname}/assets/verify-${channel}-template.hbs`, { encoding: 'utf-8' }, (err, value) => {
        if (!err) {
          this.templates[channel] = {
            subject: 'Your verify code',
            body: value,
          };
        }
      });
    });
  }

  async sendCode({ channel, address }: SubscriberChannel, reason: string): Promise<string> {
    const provider = this.providers[channel];
    if (!provider) {
      throw new InvalidOperationError(`No provider for channel ${channel}.`);
    }

    const template = this.templates[channel];
    if (!template) {
      throw new InvalidOperationError(`No verify template for channel ${channel}.`);
    }

    const verifyServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:verify-service`);

    const key = uuidv4();
    const verifyRequestUrl = new URL(`/verify/v1/code/${key}`, verifyServiceUrl);

    const token = await this.tokenProvider.getAccessToken();
    const { data } = await axios.post<{ code: string; expiresAt: string }>(
      verifyRequestUrl.href,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const message = this.templateService.generateMessage(template, {
      reason,
      code: data.code,
      expiresAt: DateTime.fromISO(data.expiresAt),
    });

    await provider.send({
      to: address,
      message,
    });

    return key;
  }

  async verifyCode(channel: SubscriberChannel, code: string): Promise<boolean> {
    const verifyServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:verify-service`);

    const key = channel.verifyKey;
    if (!key) {
      throw new InvalidOperationError('No verify key for subscriber channel.');
    }

    const verifyRequestUrl = new URL(`/verify/v1/code/${key}`, verifyServiceUrl);

    const token = await this.tokenProvider.getAccessToken();
    const { data } = await axios.post<{ verified: boolean }>(
      verifyRequestUrl.href,
      { code },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data.verified;
  }
}

interface VerifyServiceProps {
  providers: Providers;
  templateService: TemplateService;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export function createVerifyService({
  providers,
  templateService,
  directory,
  tokenProvider,
}: VerifyServiceProps): VerifyService {
  return new VerifyServiceImpl(providers, templateService, directory, tokenProvider);
}

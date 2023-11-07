import { adspId, Channel, ServiceDirectory, Template, TokenProvider } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { getTemplateBody } from '@core-services/notification-shared';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Providers, SubscriberChannel, TemplateService, VerifyService } from './notification';
import verifyEmailTemplate from './assets/verify-email-template.hbs';
import verifySlackTemplate from './assets/verify-slack-template.hbs';
import verifySmsTemplate from './assets/verify-sms-template.hbs';

const verifyTemplates = {
  [Channel.email]: verifyEmailTemplate,
  [Channel.bot]: verifySlackTemplate,
  [Channel.sms]: verifySmsTemplate,
};

export class VerifyServiceImpl implements VerifyService {
  constructor(
    private providers: Providers,
    private templateService: TemplateService,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
    private templates: Partial<Record<Channel, Template>> = {}
  ) {
    Object.keys(providers).forEach((channel: Channel) => {
      const value = verifyTemplates[channel];
      if (value) {
        this.templates[channel] = {
          subject: 'Your verify code',
          body: channel === Channel.email ? getTemplateBody(value, channel) : value,
        };
      }
    });
  }

  async sendCode(
    { channel, address }: SubscriberChannel,
    reason: string,
    expireIn?: number,
    verificationLink?: string
  ): Promise<string> {
    const provider = this.providers[channel];
    if (!provider) {
      throw new InvalidOperationError(`No provider for channel ${channel}.`);
    }

    const template = this.templates[channel];
    if (!template) {
      throw new InvalidOperationError(`No verify template for channel ${channel}.`);
    }

    if (!expireIn) {
      expireIn = 10;
    }

    const verifyServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:verify-service`);

    const key = uuidv4();
    const verifyRequestUrl = new URL(`/verify/v1/codes/${key}?expireIn=${expireIn}`, verifyServiceUrl);

    const token = await this.tokenProvider.getAccessToken();
    const { data } = await axios.post<{ code: string; expiresAt: string }>(
      verifyRequestUrl.href,
      { expireIn },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const verifyLink = `${verificationLink}?code=${data.code}`;

    const message = this.templateService.generateMessage(template, {
      reason,
      code: data.code,
      expiresAt: new Date(data.expiresAt),
      verifyLink: verifyLink,
    });

    try {
      await provider.send({
        to: address,
        message,
      });
    } catch (error) {
      console.log('error:' + JSON.stringify(error));
    }

    return key;
  }

  async verifyCode(channel: SubscriberChannel, code: string): Promise<boolean> {
    const verifyServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:verify-service`);

    const key = channel.verifyKey;
    if (!key) {
      throw new InvalidOperationError('No verify key for subscriber channel.');
    }

    const verifyRequestUrl = new URL(`/verify/v1/codes/${key}`, verifyServiceUrl);

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

import { Notification } from '../notification';
import * as nodemailer from 'nodemailer';
import { createEmailProvider } from './email';

jest.mock('nodemailer');
const nodemailerMock = nodemailer as jest.Mocked<typeof nodemailer>;
const transportMock = {
  sendMail: jest.fn(() => Promise.resolve()),
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
nodemailerMock.createTransport.mockImplementation(() => transportMock as any);

describe('createEmailProvider', () => {
  beforeEach(() => {
    transportMock.sendMail.mockClear();
  });

  it('can create provider', () => {
    const provider = createEmailProvider({
      SMTP_HOST: 'smtp.gov.ab.ca',
      SMTP_PORT: 25,
      SMTP_USER: null,
      SMTP_PASSWORD: null,
      FROM_ADDRESS: 'noreply@gov.ab.ca',
    });
    expect(provider).toBeTruthy();
  });

  it('can create provider with credentials', () => {
    const provider = createEmailProvider({
      SMTP_HOST: 'smtp.gov.ab.ca',
      SMTP_PORT: 25,
      SMTP_USER: 'tester',
      SMTP_PASSWORD: 'tester',
      FROM_ADDRESS: 'noreply@gov.ab.ca',
    });
    expect(provider).toBeTruthy();
  });

  describe('EmailProvider', () => {
    it('can send notification', async () => {
      const provider = createEmailProvider({
        SMTP_HOST: 'smtp.gov.ab.ca',
        SMTP_PORT: 25,
        SMTP_USER: null,
        SMTP_PASSWORD: null,
        FROM_ADDRESS: 'noreply@gov.ab.ca',
      });

      await provider.send({
        to: 'test@testco.org',
        message: {
          subject: '',
          body: '',
        },
      } as Notification);
      expect(transportMock.sendMail).toHaveBeenCalledTimes(1);
    });
    it('can send notification with attachemnt', async () => {
      const provider = createEmailProvider({
        SMTP_HOST: 'smtp.gov.ab.ca',
        SMTP_PORT: 25,
        SMTP_USER: null,
        SMTP_PASSWORD: null,
        FROM_ADDRESS: 'noreply@gov.ab.ca',
      });

      await provider.send({
        to: 'test@testco.org',
        message: {
          subject: '',
          body: '',
        },
        attachments: [
          {
            filename: 'results.pdf',
            content: 'JVBERi0xLjQKJdPr6eEKMSAwIGK..',
            encoding: 'base64',
            contentType: 'application/pdf',
          },
        ],
      } as Notification);
      expect(transportMock.sendMail).toHaveBeenCalledTimes(1);
    });
  });
});

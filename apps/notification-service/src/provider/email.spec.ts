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
    });
    expect(provider).toBeTruthy();
  });

  it('can create provider with credentials', () => {
    const provider = createEmailProvider({
      SMTP_HOST: 'smtp.gov.ab.ca',
      SMTP_PORT: 25,
      SMTP_USER: 'tester',
      SMTP_PASSWORD: 'tester',
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
  });
});

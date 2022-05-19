import * as nodemailer from 'nodemailer';
import { NotificationProvider } from '../notification';

interface EmailProviderProps {
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
}

export const createEmailProvider = ({
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
}: EmailProviderProps): NotificationProvider => {
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: SMTP_USER
      ? {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        }
      : null,
    secure: false,
    tls: { rejectUnauthorized: false },
  });

  return {
    send: async (notification) => {
      await transport.sendMail({
        from: { name: 'Government of Alberta', address: 'noreply@gov.ab.ca' },
        to: notification.to,
        subject: notification.message.subject,
        html: notification.message.body,
      });
    },
  };
};

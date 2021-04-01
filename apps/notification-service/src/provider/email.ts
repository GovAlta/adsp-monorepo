import * as nodemailer from 'nodemailer';
import { NotificationProvider } from '../notification/types';

interface EmailProviderProps {
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
}

export const createGoAEmailProvider = ({
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
    send: (notification) =>
      transport.sendMail({
        from: 'test@test.co',
        to: notification.to,
        subject: notification.message.subject,
        html: notification.message.body,
      }),
  };
};

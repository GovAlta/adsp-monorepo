import * as nodemailer from 'nodemailer';
import { NotificationProvider } from '../notification';

interface EmailProviderProps {
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  FROM_ADDRESS: string;
}

export const createEmailProvider = ({
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  FROM_ADDRESS,
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
        from: {
          name: 'Government of Alberta',
          address: notification.from && notification.from.length > 0 ? notification.from : FROM_ADDRESS,
        },
        to: notification.to,
        cc: notification?.cc || [],
        bcc: notification?.bcc || [],
        subject: notification.message.subject,
        html: notification.message.body,
        attachments: notification.attachments,
      });
    },
  };
};

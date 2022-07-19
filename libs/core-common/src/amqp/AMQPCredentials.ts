export type PasswordConnectionProps = {
  hostname: string;
  username: string;
  password: string;
  heartbeat: number;
};

export type UrlCredentialProps = {
  url: string;
  heartbeat: number;
};

export type ConnectionProps = PasswordConnectionProps | UrlCredentialProps;

/*
 * Two means of connecting to rabbitMQ are supported here:
 * 1. Using a URL (with embedded credentials), which is useful for connecting to
 *    cloud AMQP for testing
 * 2. Using a username / password / host connection set for connecting to
 *    ADSP servers
 *
 */
export interface AMQPCredentials {
  AMQP_URL?: string;
  AMQP_HOST?: string;
  AMQP_USER?: string;
  AMQP_PASSWORD?: string;
}

export const getConnectionProps = (credentials: AMQPCredentials, heartbeat: number): ConnectionProps => {
  if (credentials.AMQP_URL) {
    // AMQP_URL is used for testing purposes, allowing us to
    // connect to cloud AMQP, for example.
    return {
      heartbeat: heartbeat,
      url: credentials.AMQP_URL,
    };
  } else {
    // Connect to ADSP servers via username/password
    return {
      heartbeat: heartbeat,
      hostname: credentials.AMQP_HOST,
      username: credentials.AMQP_USER,
      password: credentials.AMQP_PASSWORD,
    };
  }
};

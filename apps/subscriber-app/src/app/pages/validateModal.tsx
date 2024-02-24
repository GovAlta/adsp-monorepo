import React, { FC, useEffect, useState } from 'react';

import {
  GoAButton,
  GoAButtonGroup,
  GoARadioItem,
  GoARadioGroup,
  GoAModal,
  GoAFormItem,
} from '@abgov/react-components-new';

import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { Channels, expireMinutes } from '@store/subscription/models';

interface Props {
  isOpen: boolean;
  title: string;
  testId: string;
  onValidate?: (channel) => void;
  onClose?: () => void;
}

export const ValidateModal: FC<Props> = ({ isOpen, title, onClose, testId, onValidate }: Props) => {
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [loaded, setLoaded] = useState(false);

  const { subscriber } = useSelector((state: RootState) => ({
    subscriber: state.subscription.subscriber,
  }));

  const emailChannelIndex = subscriber?.channels?.findIndex((channel) => {
    return channel.channel === Channels.email;
  });

  const smsChannelIndex = subscriber?.channels?.findIndex((channel) => {
    return channel.channel === Channels.sms;
  });

  const codeEmailExists =
    subscriber?.channels[emailChannelIndex]?.pendingVerification &&
    subscriber?.channels[emailChannelIndex]?.timeCodeSent + 1000 * 60 * expireMinutes > Date.now();
  const codeSMSExists =
    subscriber?.channels[smsChannelIndex]?.pendingVerification &&
    subscriber?.channels[smsChannelIndex]?.timeCodeSent + 1000 * 60 * expireMinutes > Date.now();

  const emailValidated = subscriber?.channels[emailChannelIndex]?.verified;
  const smsValidated = subscriber?.channels[smsChannelIndex]?.verified;

  const noSms = !subscriber?.channels[smsChannelIndex];

  let buttons = [
    { value: 'email', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
  ];

  if (codeEmailExists || emailValidated) {
    buttons = buttons.filter((item) => item?.value !== 'email');
  }

  if (codeSMSExists || smsValidated || noSms) {
    buttons = buttons.filter((item) => item?.value !== 'SMS');
  }

  useEffect(() => {
    if (!loaded) {
      setLoaded(true);
      setSelectedChannel(buttons[0]?.value);
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) {
      setLoaded(false);
    }
  }, [isOpen]);

  return (
    <div>
      <GoAModal
        open={isOpen}
        testId={testId}
        heading={title}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => {
                onClose();
              }}
            >
              Close
            </GoAButton>
            <GoAButton type="primary" onClick={() => onValidate(selectedChannel)}>
              Verify
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        {loaded && (
          <GoAFormItem label="Choose a channel to verify">
            {buttons && (
              <GoARadioGroup
                value={selectedChannel}
                name="option"
                onChange={(_, value) => setSelectedChannel(value)}
                orientation="vertical"
                testId="status-radio-group"
              >
                {buttons?.map((val) => (
                  <GoARadioItem name="option" value={val?.value} label={val.label}></GoARadioItem>
                ))}
              </GoARadioGroup>
            )}
          </GoAFormItem>
        )}
      </GoAModal>
    </div>
  );
};

import React, { FC, useEffect, useState } from 'react';

import {
  GoabButton,
  GoabButtonGroup,
  GoabRadioItem,
  GoabRadioGroup,
  GoabModal,
  GoabFormItem,
} from '@abgov/react-components';
import { GoabRadioGroupOnChangeDetail } from '@abgov/ui-components-common';
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
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOpen) {
      setLoaded(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <GoabModal
        open={isOpen}
        testId={testId}
        heading={title}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              type="secondary"
              onClick={() => {
                onClose();
              }}
            >
              Close
            </GoabButton>
            <GoabButton type="primary" onClick={() => onValidate(selectedChannel)}>
              Verify
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        {loaded && (
          <GoabFormItem label="Choose a channel to verify">
            {buttons && (
              <GoabRadioGroup
                value={selectedChannel}
                name="option"
                onChange={(detail: GoabRadioGroupOnChangeDetail) => setSelectedChannel(detail.value)}
                orientation="vertical"
                testId="status-radio-group"
              >
                {buttons?.map((val) => (
                  <GoabRadioItem name="option" value={val?.value} label={val.label}></GoabRadioItem>
                ))}
              </GoabRadioGroup>
            )}
          </GoabFormItem>
        )}
      </GoabModal>
    </div>
  );
};

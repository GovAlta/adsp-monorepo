import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { NoPaddingH2 } from '@components/AppHeader';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { RootState } from '@store/index';
import { useActionStateCheck } from '@components/Indicator';
import {
  FETCH_NOTIFICATION_CONFIGURATION,
  FetchNotificationConfigurationService,
  UpdateEmailInformationService,
} from '@store/notification/actions';
import { ReactComponent as Edit } from '@icons/edit.svg';
import { EditEmailInformationTypeModalForm } from './editEmail';
import { GoabGrid } from '@abgov/react-components';
export const EmailInformation: FunctionComponent = () => {
  const [editEmailInformation, setEditEmailInformation] = useState<boolean>(false);
  const dispatch = useDispatch();
  const isFetchLoading = useActionStateCheck(FETCH_NOTIFICATION_CONFIGURATION, 'start');
  const fromEmail = useSelector((state: RootState) => state.notification.email);

  const openModalFunction = () => {
    setEditEmailInformation(true);
  };

  const reset = () => {
    setEditEmailInformation(false);
  };

  useEffect(() => {
    dispatch(FetchNotificationConfigurationService());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line
  useEffect(() => {}, [isFetchLoading]);

  const hasConfigurationAdminRole = useSelector((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:configuration-service']?.roles?.includes('configuration-admin')
  );

  return (
    <section>
      <ContactInfoCss>
        <NoPaddingH2>
          <div className="left-float">Email information</div>
          {hasConfigurationAdminRole ? (
            <div data-testid="edit-email-info">
              <GoAContextMenuIcon
                type="create"
                title="Edit"
                testId="edit-email-info-edit"
                onClick={() => {
                  openModalFunction();
                }}
              />
            </div>
          ) : (
            <Edit
              className="disabled"
              title="You require a configuration-admin role to edit this contact information"
              width={'18px'}
            />
          )}
        </NoPaddingH2>
        <p>
          The following email information are provided to your subscribers in the subscription management application so
          they know who sent the email and how to get support for notification related issues.
        </p>
        <GoabGrid minChildWidth="320px">
          <div className="word-break contact-border">
            <h4>From email</h4>
            {fromEmail?.fromEmail}
          </div>
        </GoabGrid>
        <EditEmailInformationTypeModalForm
          open={editEmailInformation}
          initialValue={fromEmail || { fromEmail: '' }}
          onSave={(emailInfo) => {
            dispatch(UpdateEmailInformationService(emailInfo));
            setEditEmailInformation(false);
          }}
          onCancel={() => {
            reset();
          }}
        />
      </ContactInfoCss>
    </section>
  );
};

const ContactInfoCss = styled.div`
  /* The following styles prevent unbroken strings from breaking the layout */
  .word-break {
    overflow: auto;
    white-space: -moz-pre-wrap; /* Mozilla */
    white-space: -hp-pre-wrap; /* HP printers */
    white-space: -o-pre-wrap; /* Opera 7 */
    white-space: -pre-wrap; /* Opera 4-6 */
    white-space: pre-wrap; /* CSS 2.1 */
    white-space: pre-line; /* CSS 3 (and 2.1 as well, actually) */
    word-wrap: break-word; /* IE */
    -moz-binding: url('xbl.xml#wordwrap'); /* Firefox (using XBL) */
  }

  .contact-border {
    padding: 16px;
    border: 1px solid #ccc;
  }

  .disabled {
    color: var(--color-gray-500);
    fill: var(--color-gray-500);
    cursor: pointer;
    margin-left: 5px;
  }

  .left-float {
    float: left;
  }

  h4 {
    margin-top: 0;
  }
`;

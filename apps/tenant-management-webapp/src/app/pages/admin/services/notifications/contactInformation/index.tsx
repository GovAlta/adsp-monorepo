import React, { FunctionComponent, useEffect, useState } from 'react';
import type { Subscriber } from '@store/subscription/models';
import { useDispatch, useSelector } from 'react-redux';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { Grid, GridItem } from '@components/Grid';
import { UpdateContactInformationService, FetchNotificationConfigurationService } from '@store/notification/actions';
import { RootState } from '@store/index';
import styled from 'styled-components';
import { ContactInformationModalForm } from './edit';
import { ReactComponent as Edit } from '@icons/edit.svg';
import { phoneWrapper } from '../utils';

interface SubscribersProps {
  subscribers?: Subscriber[];
  readonly?: boolean;
}

export const ContactInformation: FunctionComponent<SubscribersProps> = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchNotificationConfigurationService());
  }, [dispatch]);

  const contact = useSelector((state: RootState) => state.notification.supportContact);
  const hasConfigurationAdminRole = useSelector((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:configuration-service']?.roles?.includes('configuration-admin')
  );

  const [editContactInformation, setEditContactInformation] = useState<boolean>(false);

  const openModalFunction = () => {
    setEditContactInformation(true);
  };

  function reset() {
    setEditContactInformation(false);
  }

  const initialValue = {
    contactEmail: contact?.contactEmail,
    phoneNumber: contact?.phoneNumber,
    supportInstructions: contact?.supportInstructions,
  };

  return (
    <section>
      <ContactInfoCss>
        <h2>
          <div className="left-float">Contact information </div>
          {hasConfigurationAdminRole ? (
            <div data-testid="edit-contact-info">
              <GoAContextMenuIcon
                type="create"
                title="Edit"
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
        </h2>
        <p>
          The following contact information and instructions are provided to your subscribers in the subscription
          management application so they know how to get support for notification related issues.
        </p>

        <Grid>
          <GridItem data-testid="email" className="word-break contact-border" md={8} vSpacing={1} hSpacing={0.5}>
            <h4>Contact email</h4>
            {contact?.contactEmail}
          </GridItem>
          <GridItem data-testid="phone" className="contact-border" md={4} vSpacing={1} hSpacing={0.5}>
            <h4>Phone number</h4>
            {phoneWrapper(contact?.phoneNumber)}
          </GridItem>
        </Grid>
        <Grid>
          <GridItem data-testid="support-instructions" className="contact-border" md={12} vSpacing={1} hSpacing={0}>
            <h4>Support instructions</h4>
            {contact?.supportInstructions}
          </GridItem>
        </Grid>
        <ContactInformationModalForm
          open={editContactInformation}
          initialValue={initialValue}
          onSave={(contactInfo) => {
            dispatch(UpdateContactInformationService(contactInfo));
            setEditContactInformation(false);
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

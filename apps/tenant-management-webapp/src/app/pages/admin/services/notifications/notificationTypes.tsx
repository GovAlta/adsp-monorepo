import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton, GoACard, GoAPageLoader } from '@abgov/react-components';
import { Grid, GridItem } from '@components/Grid';
import { NotificationDefinitionModalForm } from './edit';
import { EventModalForm } from './editEvent';
import {
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
  GoAIcon,
} from '@abgov/react-components/experimental';

import {
  UpdateNotificationTypeService,
  DeleteNotificationTypeService,
  FetchNotificationTypeService,
} from '@store/notification/actions';
import { NotificationTypeItem } from '@store/notification/models';
import { RootState } from '@store/index';
import styled from 'styled-components';

const emptyNotificationDefinition: NotificationTypeItem = {
  name: '',
  description: '',
  events: [],
  subscriberRoles: [],
  id: null,
};

export const NotificationTypes: FunctionComponent = () => {
  const [editDefinition, setEditDefinition] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showEventDeleteConfirmation, setShowEventDeleteConfirmation] = useState(false);

  const notification = useSelector((state: RootState) => state.notification);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchNotificationTypeService());
  }, [dispatch]);

  function reset() {
    setEditDefinition(false);
    setEditEvent(false);
    setSelectedDefinition(emptyNotificationDefinition);
    setErrors({});
  }

  function manageEvents(notificationType) {
    //Manage Events
    setSelectedDefinition(notificationType);
    setEditEvent(notificationType);
  }

  console.log(selectedDefinition + '<selectedDEfxxx');

  return (
    <NotficationStyles>
      <div>
        <p>
          Notification types represent a bundled set of notifications that can be subscribed to and provides the access
          roles for that set. For example, a ‘Application Progress’ type could include notifications for submission of
          the application, processing started, and application processed.
        </p>
        <p>
          A subscriber has a subscription to the set and cannot subscribe to the individual notifications in the set.
          Notification types are configured in the configuration service under the platform:notification-service
          namespace and name.
        </p>
      </div>
      <Buttons>
        <GoAButton
          data-testid="add-notification"
          buttonSize="small"
          onClick={() => {
            setSelectedDefinition(null);
            setEditDefinition(true);
          }}
        >
          Add a notification type
        </GoAButton>
      </Buttons>
      {notification.notificationTypes &&
        Object.values(notification.notificationTypes).map((notificationType) => (
          <div className="topBottomMargin" key={notificationType.name}>
            <GoACard
              title={
                <div className="rowFlex">
                  <div className="flex1">{notificationType.name}</div>
                  <div className="rowFlex">
                    <a
                      className="flex1"
                      data-testid="edit-details"
                      onClick={() => {
                        setSelectedDefinition(notificationType);
                        setEditDefinition(true);
                      }}
                    >
                      <NotificationBorder className="smallPadding" delete-details>
                        <GoAIcon type="create" />
                      </NotificationBorder>
                    </a>
                    <a
                      className="flex1"
                      onClick={() => {
                        setSelectedDefinition(notificationType);
                        setShowDeleteConfirmation(true);
                      }}
                      data-testid="delete-details"
                    >
                      <NotificationBorder className="smallPadding">
                        <GoAIcon type="trash" />
                      </NotificationBorder>
                    </a>
                  </div>
                </div>
              }
              description={notificationType.description}
            >
              <Grid>
                {notificationType.events.map((event) => (
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <EventBorder>
                      {event.name}
                      <a
                        className="flex1"
                        onClick={() => {
                          setSelectedEvent(event);
                          setSelectedDefinition(notificationType);
                          setShowEventDeleteConfirmation(true);
                        }}
                        data-testid="delete-event"
                      >
                        <NotificationBorder className="smallPadding">
                          <GoAIcon type="trash" />
                        </NotificationBorder>
                      </a>
                      <a
                        className="flex1"
                        data-testid="edit-event"
                        onClick={() => {
                          setSelectedEvent(event);
                          manageEvents(notificationType);
                        }}
                      >
                        Edit
                      </a>
                    </EventBorder>
                  </GridItem>
                ))}
                <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                  <NotificationBorder className="padding">
                    <EventButtonWrapper>
                      <GoAButton
                        buttonType="secondary"
                        onClick={() => {
                          setSelectedEvent(null);
                          manageEvents(notificationType);
                        }}
                      >
                        + Select an Event
                      </GoAButton>
                    </EventButtonWrapper>
                    <div>Domain events represent key changes at a domain model level.</div>
                  </NotificationBorder>
                </GridItem>
              </Grid>
            </GoACard>
          </div>
        ))}
      {notification.notificationTypes === undefined && (
        <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
      )}
      {/* Delete confirmation */}
      <GoAModal testId="delete-confirmation" isOpen={showDeleteConfirmation}>
        <GoAModalTitle>Delete Definition</GoAModalTitle>
        <GoAModalContent>Delete {selectedDefinition?.name}?</GoAModalContent>
        <GoAModalActions>
          <GoAButton buttonType="tertiary" data-testid="delete-cancel" onClick={() => setShowDeleteConfirmation(false)}>
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="delete-confirm"
            onClick={() => {
              setShowDeleteConfirmation(false);
              dispatch(DeleteNotificationTypeService(selectedDefinition));
            }}
          >
            Confirm
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
      {/* Event delete confirmation */}
      <GoAModal testId="event-delete-confirmation" isOpen={showEventDeleteConfirmation}>
        <GoAModalTitle>Delete Definition</GoAModalTitle>
        <GoAModalContent>Delete {selectedEvent?.name}?</GoAModalContent>
        <GoAModalActions>
          <GoAButton
            buttonType="tertiary"
            data-testid="delete-cancel"
            onClick={() => setShowEventDeleteConfirmation(false)}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="delete-confirm"
            onClick={() => {
              setShowEventDeleteConfirmation(false);
              console.log(
                JSON.stringify(`${selectedEvent.namespace}:${selectedEvent.name}`) +
                  '<-- selectedEvent.namespace selectedEvent.name '
              );
              console.log(JSON.stringify(selectedDefinition.events) + '<-- selectedDefinition');
              const updatedEvents = selectedDefinition.events.filter(
                (event) => `${event.namespace}:${event.name}` !== `${selectedEvent.namespace}:${selectedEvent.name}`
              );
              selectedDefinition.events = updatedEvents;
              console.log(JSON.stringify(selectedDefinition.events) + '<-- selectedDefinition.events ');
              dispatch(UpdateNotificationTypeService(selectedDefinition));
            }}
          >
            Confirm
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
      {/* Form */}
      <NotificationDefinitionModalForm
        open={editDefinition}
        initialValue={selectedDefinition}
        errors={errors}
        onSave={(definition) => {
          definition.subscriberRoles = [];
          definition.events = [];
          dispatch(UpdateNotificationTypeService(definition));
          reset();
        }}
        onCancel={() => {
          reset();
        }}
      />
      {console.log(JSON.stringify(selectedDefinition) + '<selectedDEf')}
      <EventModalForm
        open={editEvent}
        initialValue={editEvent}
        selectedEvent={selectedEvent}
        errors={errors}
        onSave={(definition) => {
          console.log(JSON.stringify(definition) + '<defxx');
          definition.subscriberRoles = [];
          dispatch(UpdateNotificationTypeService(definition));
          reset();
        }}
        onCancel={() => {
          reset();
        }}
      />
    </NotficationStyles>
  );
};

export default NotificationTypes;

const Buttons = styled.div`
  margin: 2rem 0 2rem 0;
  text-align: left;
`;

const NotificationBorder = styled.div`
  border: 1px solid #56a0d8;
  margin: 3px;
  border-radius: 3px;
`;

const EventBorder = styled.div`
  border: 1px solid #e6e6e6;
  margin: 3px;
  border-radius: 3px;
`;

const EventButtonWrapper = styled.div`
  text-align: center;
  margin: 30px 0;
`;

const NotficationStyles = styled.div`
  svg {
    fill: #56a0d8;
    color: #56a0d8;
  }

  .topBottomMargin {
    margin: 10px 0;
  }

  .rowFlex {
    display: flex;
    flex-direction: row;
  }

  .flex1 {
    flex: 1;
  }

  .padding {
    padding: 20px;
  }

  .smallPadding {
    padding: 3px;
  }
`;

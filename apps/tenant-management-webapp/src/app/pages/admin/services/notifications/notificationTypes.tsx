import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton, GoACard, GoAPageLoader } from '@abgov/react-components';
import { Grid, GridItem } from '@components/Grid';
import { NotificationTypeModalForm } from './edit';
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
import { NotificationItem } from '@store/notification/models';
import { RootState } from '@store/index';
import styled from 'styled-components';

const emptyNotificationType: NotificationItem = {
  name: '',
  description: '',
  events: [],
  subscriberRoles: [],
  id: null,
  publicSubscribe: false,
};

interface ParentCompProps {
  activeEdit?: boolean;
  activateEdit?: (boolean) => void;
}

export const NotificationTypes: FunctionComponent<ParentCompProps> = ({ activeEdit, activateEdit }) => {
  const [editType, setEditType] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
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
    setEditType(false);
    setEditEvent(false);
    setSelectedType(emptyNotificationType);
    setErrors({});
  }

  useEffect(() => {
    if (activeEdit) {
      setSelectedType(null);
      setEditType(true);
      activateEdit(false);
    }
  }, [activeEdit]);

  function manageEvents(notificationType) {
    //Manage Events
    setSelectedType(notificationType);
    setEditEvent(notificationType);
  }

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
            setSelectedType(null);
            setEditType(true);
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
                  <h2 className="flex1">{notificationType.name}</h2>
                  <div className="rowFlex height30">
                    <a
                      className="flex1"
                      data-testid={`edit-notification-type-${notificationType.id}`}
                      onClick={() => {
                        setSelectedType(notificationType);
                        setEditType(true);
                      }}
                    >
                      <NotificationBorder className="smallPadding">
                        <GoAIcon type="create" />
                      </NotificationBorder>
                    </a>
                    <a
                      className="flex1"
                      onClick={() => {
                        setSelectedType(notificationType);
                        setShowDeleteConfirmation(true);
                      }}
                      data-testid={`delete-notification-type-${notificationType.id}`}
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
                {notificationType.events.map((event, key) => (
                  <GridItem key={key} md={6} vSpacing={1} hSpacing={0.5}>
                    <EventBorder className="height168">
                      <div className="rowFlex">
                        <div className="flex1">{event.name}</div>
                        <div className="rowFlex">
                          <a
                            className="flex1 flex height34"
                            onClick={() => {
                              setSelectedEvent(event);
                              setSelectedType(notificationType);
                              setShowEventDeleteConfirmation(true);
                            }}
                            data-testid={`delete-event-${notificationType.id}`}
                          >
                            <NotificationBorder className="smallPadding">
                              <GoAIcon type="trash" />
                            </NotificationBorder>
                          </a>
                        </div>
                      </div>
                      <div className="columnFlex height100">
                        <div className="flex1 flex flexEndAlign">
                          <div className="rightAlignEdit">
                            <a
                              data-testid={`edit-event-${notificationType.id}`}
                              onClick={() => {
                                setSelectedEvent(event);
                                manageEvents(notificationType);
                              }}
                            >
                              Edit
                            </a>
                          </div>
                        </div>
                      </div>
                    </EventBorder>
                  </GridItem>
                ))}
                <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                  <NotificationBorder className="padding">
                    <EventButtonWrapper>
                      <GoAButton
                        buttonType="secondary"
                        data-testid={`add-event-${notificationType.id}`}
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
        <GoAModalTitle>Delete Type</GoAModalTitle>
        <GoAModalContent>Delete {selectedType?.name}?</GoAModalContent>
        <GoAModalActions>
          <GoAButton buttonType="tertiary" data-testid="delete-cancel" onClick={() => setShowDeleteConfirmation(false)}>
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="delete-confirm"
            onClick={() => {
              setShowDeleteConfirmation(false);
              dispatch(DeleteNotificationTypeService(selectedType));
            }}
          >
            Confirm
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
      {/* Event delete confirmation */}
      <GoAModal testId="event-delete-confirmation" isOpen={showEventDeleteConfirmation}>
        <GoAModalTitle>Remove Event</GoAModalTitle>
        <GoAModalContent>Remove {selectedEvent?.name}?</GoAModalContent>
        <GoAModalActions>
          <GoAButton
            buttonType="tertiary"
            data-testid="event-delete-cancel"
            onClick={() => setShowEventDeleteConfirmation(false)}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="event-delete-confirm"
            onClick={() => {
              setShowEventDeleteConfirmation(false);
              const updatedEvents = selectedType.events.filter(
                (event) => `${event.namespace}:${event.name}` !== `${selectedEvent.namespace}:${selectedEvent.name}`
              );
              selectedType.events = updatedEvents;
              dispatch(UpdateNotificationTypeService(selectedType));
            }}
          >
            Confirm
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
      {/* Form */}
      <NotificationTypeModalForm
        open={editType}
        initialValue={selectedType}
        errors={errors}
        onSave={(type) => {
          type.subscriberRoles = type.subscriberRoles || [];
          type.events = type.events || [];
          type.publicSubscribe = type.publicSubscribe || false;
          dispatch(UpdateNotificationTypeService(type));
          reset();
        }}
        onCancel={() => {
          reset();
        }}
      />
      <EventModalForm
        open={editEvent}
        initialValue={editEvent}
        selectedEvent={selectedEvent}
        errors={errors}
        onSave={(type) => {
          type.subscriberRoles = [];
          dispatch(UpdateNotificationTypeService(type));
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
  padding: 20px;
`;

const EventButtonWrapper = styled.div`
  text-align: center;
  margin: 19px 0;
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

  .columnFlex {
    display: flex;
    flex-direction: column;
  }

  .height100 {
    height: 100px;
  }

  .flex {
    display: flex;
  }

  .flex1 {
    flex: 1;
  }

  .height30 {
    max-height: 30px;
  }

  .height34 {
    max-height: 34px;
  }

  .height163 {
    max-height: 163px;
  }

  .padding {
    padding: 20px;
  }

  .smallPadding {
    padding: 3px;
  }

  .flexEndAlign {
    align-items: flex-end;
  }

  .rightAlignEdit {
    text-align: end;
    width: 100%;
  }
`;

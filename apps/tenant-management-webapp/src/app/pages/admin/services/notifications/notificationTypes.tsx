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
  FetchCoreNotificationTypeService,
} from '@store/notification/actions';
import { NotificationItem } from '@store/notification/models';
import { RootState } from '@store/index';
import styled from 'styled-components';
import { TemplateForm } from './templateForm';
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
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [disableTemplateForm, setDisableTemplateForm] = useState(false);
  const notification = useSelector((state: RootState) => state.notification);
  const coreNotification = useSelector((state: RootState) => state.notification.core);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchNotificationTypeService());
    dispatch(FetchCoreNotificationTypeService());
  }, [dispatch]);

  function reset() {
    setEditType(false);
    setEditEvent(null);
    setSelectedType(emptyNotificationType);
    setErrors({});
    setShowTemplateForm(false);
    setDisableTemplateForm(false);
  }
  function isEmptyTemplate(event) {
    return event.templates?.email?.body?.length === 0 && event.templates?.email?.subject?.length === 0;
  }

  useEffect(() => {
    if (activeEdit) {
      setSelectedType(null);
      setEditType(true);
      activateEdit(false);
      setShowTemplateForm(false);
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
                  <MaxHeight height={30} className="rowFlex">
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
                  </MaxHeight>
                </div>
              }
              description={notificationType.description}
            >
              <Grid>
                {notificationType.events.map((event, key) => (
                  <GridItem key={key} md={6} vSpacing={1} hSpacing={0.5}>
                    <EventBorder>
                      <MaxHeight height={168}>
                        <div className="rowFlex">
                          <div className="flex1">
                            {event.namespace}:{event.name}
                          </div>
                          <div className="rowFlex">
                            <MaxHeight height={34}>
                              <NotificationBorder className="smallPadding">
                                <a
                                  className="flex1 flex"
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setSelectedType(notificationType);
                                    setShowEventDeleteConfirmation(true);
                                  }}
                                  data-testid={`delete-event-${notificationType.id}`}
                                >
                                  <GoAIcon type="trash" />
                                </a>
                              </NotificationBorder>
                            </MaxHeight>
                          </div>
                        </div>
                        <div className="columnFlex height-100">
                          <div className="flex1 flex flexEndAlign">
                            <a>
                              <NotificationBorder className="smallPadding">
                                <GoAIcon type="mail" style="filled" />
                              </NotificationBorder>
                            </a>
                            <div className="rightAlignEdit">
                              <a
                                style={{ marginRight: '20px' }}
                                data-testid={`preview-event-${notificationType.id}`}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setSelectedType(notificationType);
                                  setShowTemplateForm(true);
                                  setDisableTemplateForm(true);
                                }}
                              >
                                Preview
                              </a>

                              <a
                                data-testid={`edit-event-${notificationType.id}`}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setSelectedType(notificationType);
                                  setShowTemplateForm(true);
                                  setDisableTemplateForm(false);
                                }}
                              >
                                Edit
                              </a>
                            </div>
                          </div>
                        </div>
                      </MaxHeight>
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
      <h2>Core notifications:</h2>
      {coreNotification &&
        Object.values(coreNotification).map((notificationType) => (
          <div className="topBottomMargin" key={notificationType.name}>
            <GoACard
              title={
                <div className="rowFlex">
                  <h2 className="flex1">{notificationType.name}</h2>
                </div>
              }
              description={notificationType.description}
            >
              <h2>Events:</h2>
              <Grid>
                {notificationType?.events?.map((event, key) => (
                  <GridItem key={key} md={6} vSpacing={1} hSpacing={0.5}>
                    <EventBorder>
                      <div className="height-100 columnFlex">
                        <div className="flex1">
                          {event.namespace}:{event.name}
                        </div>
                        <div className="rowFlex">
                          <NotificationBorder className="smallPadding">
                            <a>
                              <GoAIcon type="mail" style="filled" />
                            </a>
                          </NotificationBorder>

                          <div className="rightAlignEdit">
                            <a
                              style={{ marginRight: '20px' }}
                              data-testid={`preview-event-${notificationType.id}`}
                              onClick={() => {
                                setSelectedEvent(event);
                                setSelectedType(notificationType);
                                setShowTemplateForm(true);
                                setDisableTemplateForm(true);
                              }}
                            >
                              Preview
                            </a>
                          </div>
                        </div>
                      </div>
                    </EventBorder>
                  </GridItem>
                ))}
              </Grid>
            </GoACard>
          </div>
        ))}
      {notification.notificationTypes === undefined && (
        <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
      )}
      {/* Delete confirmation */}
      <GoAModal testId="delete-confirmation" isOpen={showDeleteConfirmation}>
        <GoAModalTitle>Delete notification type</GoAModalTitle>
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
        <GoAModalTitle>Remove event</GoAModalTitle>
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
        onNext={(notifications, event) => {
          setSelectedEvent(event);
          setSelectedType(notifications);
          setShowTemplateForm(true);
        }}
        onCancel={() => {
          reset();
        }}
      />
      <TemplateForm
        initialValue={editEvent}
        selectedEvent={selectedEvent}
        notifications={selectedType}
        open={showTemplateForm}
        disabled={disableTemplateForm}
        errors={errors}
        onSubmit={(type) => {
          dispatch(UpdateNotificationTypeService(type));
          setShowTemplateForm(false);
          reset();
        }}
        onCancel={() => {
          setShowTemplateForm(false);
          setEditEvent(null);
        }}
      />
    </NotficationStyles>
  );
};

export default NotificationTypes;

interface HeightProps {
  height: number;
}

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

const MaxHeight = styled.div`
  max-height: ${(p: HeightProps) => p.height + 'px'};
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

  .height-100 {
    height: 100px;
  }

  .flex {
    display: flex;
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

  .flexEndAlign {
    align-items: flex-end;
  }

  .rightAlignEdit {
    text-align: end;
    width: 100%;
  }
`;

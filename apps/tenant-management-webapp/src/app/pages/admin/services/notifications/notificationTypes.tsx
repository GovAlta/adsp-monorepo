import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton, GoACard } from '@abgov/react-components';
import { Grid, GridItem } from '@components/Grid';
import { NotificationTypeModalForm } from './edit';
import { EventModalForm } from './editEvent';
import { IndicatorWithDelay } from '@components/Indicator';

import {
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
  GoAIcon,
} from '@abgov/react-components/experimental';
import { FetchRealmRoles } from '@store/tenant/actions';
import { isDuplicatedNotificationName } from './validation';
import { NotificationType } from '@store/notification/models';

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
import { EmailPreview } from './emailPreview';
import { EditIcon } from '@components/icons/EditIcon';

const emptyNotificationType: NotificationItem = {
  name: '',
  description: '',
  events: [],
  subscriberRoles: [],
  id: null,
  publicSubscribe: false,
  customized: false,
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
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const notification = useSelector((state: RootState) => state.notification);
  const coreNotification = useSelector((state: RootState) => state.notification.core);
  const [formTitle, setFormTitle] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchNotificationTypeService());
    dispatch(FetchRealmRoles());
  }, [dispatch]);

  useEffect(() => {
    if (notification?.notificationTypes) {
      dispatch(FetchCoreNotificationTypeService());
    }
  }, [notification?.notificationTypes]);

  function reset() {
    setShowTemplateForm(false);
    setEditType(false);
    setEditEvent(null);
    setSelectedType(emptyNotificationType);
    setShowEmailPreview(false);
    setErrors({});
  }

  useEffect(() => {
    if (activeEdit) {
      setSelectedType(null);
      setEditType(true);
      activateEdit(false);
      setShowTemplateForm(false);
      setFormTitle('Add notification type');
    }
  }, [activeEdit]);

  function manageEvents(notificationType) {
    setSelectedType(notificationType);
    setEditEvent(notificationType);
  }

  const nonCoreCopiedNotifications: NotificationType = Object.assign({}, notification?.notificationTypes);

  if (Object.keys(coreNotification).length > 0) {
    const NotificationsIntersection = [];

    Object.keys(notification?.notificationTypes).forEach((notificationType) => {
      if (Object.keys(coreNotification).includes(notificationType)) {
        NotificationsIntersection.push(notificationType);
      }
    });

    NotificationsIntersection.forEach((notificationType) => {
      delete nonCoreCopiedNotifications[notificationType];
    });
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
          onClick={() => {
            setSelectedType(null);
            setEditType(true);
            setFormTitle('Add notification type');
          }}
        >
          Add notification type
        </GoAButton>
      </Buttons>
      {nonCoreCopiedNotifications &&
        Object.values(nonCoreCopiedNotifications).map((notificationType) => (
          <div className="topBottomMargin" key={`notification-list-${notificationType.id}`}>
            <GoACard
              title={
                <div>
                  <div className="rowFlex">
                    <h2 className="flex1">{notificationType.name}</h2>
                    <MaxHeight height={30} className="rowFlex">
                      <a
                        className="flex1"
                        data-testid="edit-notification-type"
                        onClick={() => {
                          setSelectedType(notificationType);
                          setEditType(true);
                          setFormTitle('Edit notification type');
                        }}
                      >
                        <NotificationBorder className="smallPadding" style={{ height: '26px', display: 'flex' }}>
                          <EditIcon size="small" />
                        </NotificationBorder>
                      </a>
                      <a
                        className="flex1"
                        onClick={() => {
                          setSelectedType(notificationType);
                          setShowDeleteConfirmation(true);
                        }}
                        data-testid="delete-notification-type"
                      >
                        <NotificationBorder className="smallPadding">
                          <GoAIcon type="trash" />
                        </NotificationBorder>
                      </a>
                    </MaxHeight>
                  </div>
                  <div className="rowFlex smallFont">
                    <div className="flex1">
                      Subscriber Roles:{' '}
                      <b>
                        {notificationType.subscriberRoles
                          .filter((value) => value !== 'anonymousRead')
                          .map(
                            (roles, ix) => roles + (notificationType.subscriberRoles.length - 1 === ix ? '' : ', ')
                          )}{' '}
                      </b>
                    </div>
                    <div>Public Subscription: {notificationType.publicSubscribe ? 'yes' : 'no'}</div>
                  </div>
                </div>
              }
              description={`Description: ${notificationType.description}`}
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
                                  data-testid="delete-event"
                                >
                                  <GoAIcon type="trash" />
                                </a>
                              </NotificationBorder>
                            </MaxHeight>
                          </div>
                        </div>
                        <div className="columnFlex height-100">
                          <div className="flex1 flex flexEndAlign">
                            <NotificationBorder className="smallPadding">
                              <a className="noCursor">
                                <GoAIcon type="mail" style="filled" />
                              </a>
                            </NotificationBorder>

                            <div className="rightAlignEdit">
                              <a
                                style={{ marginRight: '20px' }}
                                data-testid="preview-event"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setSelectedType(notificationType);
                                  setShowEmailPreview(true);
                                }}
                              >
                                Preview
                              </a>

                              <a
                                data-testid="edit-event"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setSelectedType(notificationType);
                                  setShowTemplateForm(true);
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
                        data-testid="add-event"
                        onClick={() => {
                          setSelectedEvent(null);
                          manageEvents(notificationType);
                        }}
                      >
                        + Select an event
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
          <div className="topBottomMargin" key={`notification-list-${notificationType.id}`}>
            <GoACard
              title={
                <div className="rowFlex">
                  <h2 className="flex1">{notificationType.name}</h2>
                </div>
              }
              description={notificationType.description}
            >
              {notificationType.customized && (
                <div style={{ float: 'right', fontWeight: 'bold' }}>Override editing activated</div>
              )}
              <h2>Events:</h2>
              {/* {JSON.stringify(notification?.notificationTypes)} */}
              <Grid>
                {notificationType?.events?.map((event, key) => (
                  <GridItem key={key} md={6} vSpacing={1} hSpacing={0.5}>
                    <EventBorder>
                      <MaxHeight height={168}>
                        <div className="rowFlex">
                          <div className="flex1">
                            {event.namespace}:{event.name}
                          </div>
                          <div className="rowFlex">
                            <MaxHeight height={34}>
                              {event.customized && (
                                <NotificationBorder className="smallPadding">
                                  <a
                                    className="flex1 flex"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setSelectedType(notificationType);
                                      setShowEventDeleteConfirmation(true);
                                    }}
                                    data-testid="delete-event"
                                  >
                                    <GoAIcon type="trash" />
                                  </a>
                                </NotificationBorder>
                              )}
                            </MaxHeight>
                          </div>
                        </div>
                        <div className="columnFlex height-100">
                          <div className="flex1 flex flexEndAlign">
                            <NotificationBorder className="smallPadding">
                              <a className="noCursor">
                                <GoAIcon type="mail" style="filled" />
                              </a>
                            </NotificationBorder>

                            <div className="rightAlignEdit">
                              <a
                                style={{ marginRight: '20px' }}
                                data-testid="preview-event"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setSelectedType(notificationType);
                                  setShowEmailPreview(true);
                                }}
                              >
                                Preview
                              </a>
                              <a
                                data-testid="edit-event"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setSelectedType(notificationType);
                                  setShowTemplateForm(true);
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
              </Grid>
            </GoACard>
          </div>
        ))}
      {notification.notificationTypes === undefined && (
        <IndicatorWithDelay message="Loading..." pageLock={false} />
      )}
      {/* Delete confirmation */}
      <GoAModal testId="delete-confirmation" isOpen={showDeleteConfirmation}>
        <GoAModalTitle>Delete notification type</GoAModalTitle>
        <GoAModalContent>Delete {selectedType?.name}?</GoAModalContent>
        <GoAModalActions>
          <GoAButton
            buttonType="tertiary"
            data-testid="delete-cancel"
            onClick={() => {
              setShowDeleteConfirmation(false);
              setSelectedType(emptyNotificationType);
            }}
          >
            Cancel
          </GoAButton>

          <GoAButton
            buttonType="primary"
            data-testid="delete-confirm"
            onClick={() => {
              setShowDeleteConfirmation(false);
              dispatch(DeleteNotificationTypeService(selectedType));
              setSelectedType(emptyNotificationType);
            }}
          >
            Confirm
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
      {/* Event delete confirmation */}
      <GoAModal testId="event-delete-confirmation" isOpen={showEventDeleteConfirmation}>
        <GoAModalTitle>Remove event</GoAModalTitle>
        <GoAModalContent>
          Remove {selectedEvent?.namespace}:{selectedEvent?.name}?
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton
            buttonType="tertiary"
            data-testid="event-delete-cancel"
            onClick={() => {
              setShowEventDeleteConfirmation(false);
              setSelectedType(emptyNotificationType);
            }}
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

              const newType = JSON.parse(JSON.stringify(selectedType));
              newType.events = updatedEvents;
              dispatch(UpdateNotificationTypeService(newType));
              setSelectedType(emptyNotificationType);
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
        title={formTitle}
        onSave={(type) => {
          type.subscriberRoles = type.subscriberRoles || [];
          type.events = type.events || [];
          type.publicSubscribe = type.publicSubscribe || false;
          const isDuplicatedName =
            notification.notificationTypes &&
            isDuplicatedNotificationName(coreNotification, notification.notificationTypes, selectedType, type.name);
          if (isDuplicatedName) {
            setErrors({ name: 'Duplicated name of notification type.' });
          } else {
            dispatch(UpdateNotificationTypeService(type));
            reset();
          }
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
        onClickedOutside={() => {
          reset();
        }}
      />
      <TemplateForm
        initialValue={editEvent}
        selectedEvent={selectedEvent}
        notifications={selectedType}
        open={showTemplateForm}
        errors={errors}
        onSubmit={(type) => {
          dispatch(UpdateNotificationTypeService(type));
          reset();
        }}
        onCancel={() => {
          setShowTemplateForm(false);
        }}
        onClickedOutside={() => {
          reset();
        }}
      />

      <EmailPreview
        initialValue={editEvent}
        selectedEvent={selectedEvent}
        notifications={selectedType}
        open={showEmailPreview}
        onCancel={() => {
          setShowEmailPreview(false);
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
  .smallFont {
    font-size: 12px;
  }

  svg {
    fill: #56a0d8;
    color: #56a0d8;
  }

  .goa-title {
    margin-bottom: 14px !important;
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
  .noCursor {
    cursor: default;
  }
`;

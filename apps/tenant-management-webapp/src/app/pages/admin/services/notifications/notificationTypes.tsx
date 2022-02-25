import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton, GoACard } from '@abgov/react-components';
import { Grid, GridItem } from '@components/Grid';
import { NotificationTypeModalForm } from './edit';
import { EventModalForm } from './editEvent';
import { IndicatorWithDelay } from '@components/Indicator';
import debounce from 'lodash.debounce';
import * as handlebars from 'handlebars/dist/cjs/handlebars';
import { DeleteModal } from '@components/DeleteModal';

import { GoAIcon } from '@abgov/react-components/experimental';
import { FetchRealmRoles } from '@store/tenant/actions';
import { isDuplicatedNotificationName } from './validation';
import { NotificationType } from '@store/notification/models';
import DOMPurify from 'dompurify';
import { generateMessage } from '@lib/handlebarHelper';
import { getTemplateBody } from '@shared/utils/html';

import {
  UpdateNotificationTypeService,
  DeleteNotificationTypeService,
  FetchNotificationTypeService,
  FetchCoreNotificationTypeService,
} from '@store/notification/actions';
import { NotificationItem } from '@store/notification/models';
import { RootState } from '@store/index';
import styled from 'styled-components';
import { EmailPreview } from './emailPreview';
import { EditIcon } from '@components/icons/EditIcon';
import { subjectEditorConfig, bodyEditorConfig } from './emailPreviewEditor/config';
import {
  PreviewTemplateContainer,
  NotificationTemplateEditorContainer,
  Modal,
  BodyGlobalStyles,
  ModalContent,
} from './emailPreviewEditor/styled-components';
import { TemplateEditor } from './emailPreviewEditor/TemplateEditor';
import { PreviewTemplate } from './emailPreviewEditor/PreviewTemplate';
import { dynamicGeneratePayload } from '@lib/dynamicPlaceHolder';
import { convertToSuggestion } from '@lib/autoComplete';

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
  const [coreEvent, setCoreEvent] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [templateEditErrors, setTemplateEditErrors] = useState({
    subject: '',
    body: '',
  });
  const syntaxErrorMessage = 'Cannot render the code, please fix the syntax error in the input field';
  const notification = useSelector((state: RootState) => state.notification);
  const coreNotification = useSelector((state: RootState) => state.notification.core);
  const [formTitle, setFormTitle] = useState<string>('');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [subjectPreview, setSubjectPreview] = useState('');
  const [bodyPreview, setBodyPreview] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  const eventDefinitions = useSelector((state: RootState) => state.event.definitions);
  const eventDef = eventDefinitions[`${selectedEvent?.namespace}:${selectedEvent?.name}`];
  const htmlPayload = dynamicGeneratePayload(eventDef);
  const serviceName = `${selectedEvent?.namespace}:${selectedEvent?.name}`;
  const TEMPALTE_RENDER_DEBOUNCE_TIMER = 500; // ms

  const getEventSuggestion = () => {
    if (eventDef) {
      return convertToSuggestion(eventDef);
    }
    return [];
  };

  useEffect(() => {
    // if an event is selected for editing
    if (selectedEvent) {
      setSubject(selectedEvent?.templates?.email?.subject);
      setBody(selectedEvent?.templates?.email?.body);
      // try to render preview of subject and body.
      // Will only load if the subject and body is a valid handlebar template
      try {
        setBodyPreview(generateMessage(getTemplateBody(selectedEvent?.templates?.email?.body), htmlPayload));
        setTemplateEditErrors({
          ...templateEditErrors,
          body: '',
        });
      } catch (e) {
        setTemplateEditErrors({
          ...templateEditErrors,
          body: syntaxErrorMessage,
        });
      }
      try {
        setSubjectPreview(generateMessage(selectedEvent?.templates?.email?.subject, htmlPayload));
        setTemplateEditErrors({
          ...templateEditErrors,
          subject: '',
        });
      } catch (e) {
        setTemplateEditErrors({
          ...templateEditErrors,
          subject: syntaxErrorMessage,
        });
      }
    }
  }, [selectedEvent]);

  useEffect(() => {
    dispatch(FetchNotificationTypeService());
    dispatch(FetchRealmRoles());
  }, [dispatch]);

  useEffect(() => {
    if (notification?.notificationTypes !== undefined) {
      dispatch(FetchCoreNotificationTypeService());
    }
  }, [notification?.notificationTypes]);

  function resetEventEditorForm() {
    setTemplateEditErrors({
      subject: '',
      body: '',
    });
  }
  function reset() {
    setShowTemplateForm(false);
    setEventTemplateFormState(addNewEventTemplateContent);
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
  const debouncedSaveSubjectPreview = debounce((value) => {
    try {
      const msg = generateMessage(value, htmlPayload);
      setSubjectPreview(msg);
      setTemplateEditErrors({
        ...templateEditErrors,
        subject: '',
      });
    } catch (e) {
      console.error('handlebar error', e);
      setTemplateEditErrors({
        ...templateEditErrors,
        subject: syntaxErrorMessage,
      });
    }
  }, TEMPALTE_RENDER_DEBOUNCE_TIMER);
  const debouncedSaveBodyPreview = debounce((value) => {
    try {
      const msg = generateMessage(getTemplateBody(value), htmlPayload);
      setBodyPreview(msg);
      setTemplateEditErrors({
        ...templateEditErrors,
        body: '',
      });
    } catch (e) {
      console.error('handlebar error', e);
      setTemplateEditErrors({
        ...templateEditErrors,
        body: syntaxErrorMessage,
      });
    }
  }, TEMPALTE_RENDER_DEBOUNCE_TIMER);

  const nonCoreCopiedNotifications: NotificationType = Object.assign({}, notification?.notificationTypes);

  if (Object.keys(coreNotification).length > 0 && notification?.notificationTypes) {
    const NotificationsIntersection = [];

    Object.keys(nonCoreCopiedNotifications).forEach((notificationType) => {
      if (Object.keys(coreNotification).includes(notificationType)) {
        NotificationsIntersection.push(notificationType);
      }
    });

    NotificationsIntersection.forEach((notificationType) => {
      delete nonCoreCopiedNotifications[notificationType];
    });
  }
  delete nonCoreCopiedNotifications.contact;

  const saveOrAddEventTemplate = () => {
    const definitionEventIndex = selectedType?.events?.findIndex(
      (def) => `${def.namespace}:${def.name}` === `${selectedEvent.namespace}:${selectedEvent.name}`
    );
    selectedType.events[definitionEventIndex] = {
      ...selectedEvent,
      templates: {
        email: {
          subject,
          body,
        },
      },
    };
    dispatch(UpdateNotificationTypeService(selectedType));
    reset();
  };
  const editEventTemplateContent = {
    saveOrAddActionText: 'Save',
    cancelOrBackActionText: 'Cancel',
    mainTitle: 'Edit an email template',
  };
  const addNewEventTemplateContent = {
    saveOrAddActionText: 'Add',
    cancelOrBackActionText: 'Back',
    mainTitle: 'Add an email template',
  };
  const [eventTemplateFormState, setEventTemplateFormState] = useState(addNewEventTemplateContent);

  const eventTemplateEditHintText =
    "*GOA default header and footer wrapper is applied if the template doesn't include proper <html> opening and closing tags";
  const validateEventTemplateFields = () => {
    if (subject.length === 0 || body.length === 0) {
      return false;
    }
    if (templateEditErrors.subject || templateEditErrors.body) {
      return false;
    }
    try {
      handlebars.parse(body);
      handlebars.parse(subject);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

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
            setSelectedType(emptyNotificationType);
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
                  {notificationType?.subscriberRoles && (
                    <div className="rowFlex smallFont">
                      <div className="flex1">
                        Subscriber Roles:{' '}
                        <b>
                          {notificationType?.subscriberRoles
                            .filter((value) => value !== 'anonymousRead')
                            .map(
                              (roles, ix) => roles + (notificationType.subscriberRoles.length - 1 === ix ? '' : ', ')
                            )}{' '}
                        </b>
                      </div>
                      <div>Public Subscription: {notificationType.publicSubscribe ? 'yes' : 'no'}</div>
                    </div>
                  )}
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
                                    setCoreEvent(false);
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
                                  setEventTemplateFormState(editEventTemplateContent);
                                  setShowTemplateForm(true);
                                  setCoreEvent(false);
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
              <h2>Events:</h2>
              <Grid>
                {notificationType?.events?.map((event, key) => (
                  <GridItem key={key} md={6} vSpacing={1} hSpacing={0.5}>
                    <EventBorder>
                      <MaxHeight height={168}>
                        <div className="rowFlex">
                          <div className="flex1">
                            {event.namespace}:{event.name}
                          </div>
                        </div>
                        <div className="columnFlex height-100">
                          <div className="flex1 flex flexEndAlign">
                            <div className="flex1">
                              <MailButton>
                                <NotificationBorder className="smallPadding">
                                  <a className="noCursor">
                                    <GoAIcon type="mail" style="filled" />
                                  </a>
                                </NotificationBorder>
                              </MailButton>
                              {event.customized && <SmallText>Edited</SmallText>}
                            </div>
                            <div className="rightAlignEdit flex1">
                              {event.customized && (
                                <a
                                  style={{ marginRight: '10px', fontSize: '15px' }}
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setSelectedType(notificationType);
                                    setCoreEvent(true);
                                    setShowEventDeleteConfirmation(true);
                                  }}
                                  data-testid="delete-event"
                                >
                                  Reset
                                </a>
                              )}

                              <a
                                style={{ marginRight: '10px', fontSize: '15px' }}
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
                                style={{ fontSize: '15px' }}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setSelectedType(notificationType);
                                  setEventTemplateFormState(editEventTemplateContent);
                                  setShowTemplateForm(true);
                                  setCoreEvent(true);
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
      {notification.notificationTypes === undefined && <IndicatorWithDelay message="Loading..." pageLock={false} />}
      {/* Delete confirmation */}

      {showDeleteConfirmation && (
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete notification type"
          content={`Delete ${selectedType?.name}?`}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setSelectedType(emptyNotificationType);
          }}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(DeleteNotificationTypeService(selectedType));
            setSelectedType(emptyNotificationType);
          }}
        />
      )}
      {/* Event delete confirmation */}
      {showEventDeleteConfirmation && (
        <DeleteModal
          isOpen={showEventDeleteConfirmation}
          title={coreEvent ? 'Reset email template' : 'Delete event'}
          content={
            coreEvent
              ? 'Delete custom email template modifications'
              : `Delete ${selectedEvent?.namespace}:${selectedEvent?.name}`
          }
          onCancel={() => {
            setShowEventDeleteConfirmation(false);
            setSelectedType(emptyNotificationType);
            setCoreEvent(false);
          }}
          onDelete={() => {
            setShowEventDeleteConfirmation(false);
            const updatedEvents = selectedType.events.filter(
              (event) =>
                `${event.namespace}:${event.name}` !== `${selectedEvent.namespace}:${selectedEvent.name}` &&
                (!coreEvent || event.customized)
            );

            const newType = JSON.parse(JSON.stringify(selectedType));
            newType.events = updatedEvents;

            newType.events = newType.events.map((event) => {
              event.channels = [];
              return event;
            });
            dispatch(UpdateNotificationTypeService(newType));
            setSelectedType(emptyNotificationType);
            setCoreEvent(false);
          }}
        />
      )}

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
      {/* add an event */}
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

      {/* Edit/Add event template for a notification */}
      <Modal open={showTemplateForm} data-testid="template-form">
        {/* Hides body overflow when the modal is up */}
        <BodyGlobalStyles hideOverflow={showTemplateForm} />
        <ModalContent>
          <NotificationTemplateEditorContainer>
            <TemplateEditor
              mainTitle={eventTemplateFormState.mainTitle}
              subjectTitle="Subject"
              subject={subject}
              serviceName={serviceName}
              onSubjectChange={(value) => {
                setSubject(value);
                debouncedSaveSubjectPreview(value);
              }}
              subjectEditorConfig={subjectEditorConfig}
              bodyTitle="Body"
              onBodyChange={(value) => {
                setBody(value);
                debouncedSaveBodyPreview(value);
              }}
              body={body}
              bodyEditorConfig={bodyEditorConfig}
              errors={templateEditErrors}
              bodyEditorHintText={eventTemplateEditHintText}
              eventSuggestion={getEventSuggestion()}
              actionButtons={
                <>
                  <GoAButton
                    onClick={() => {
                      // while editing existing event, clear the event on cancel so the changes did are discarded and not saved in local state
                      if (eventTemplateFormState.cancelOrBackActionText === 'Cancel') {
                        setSelectedEvent(null);
                      }
                      setSubject('');
                      setBody('');
                      setShowTemplateForm(false);
                      resetEventEditorForm();
                      setEventTemplateFormState(addNewEventTemplateContent);
                    }}
                    data-testid="template-form-cancel"
                    buttonType="tertiary"
                    type="button"
                  >
                    {eventTemplateFormState.cancelOrBackActionText}
                  </GoAButton>
                  <GoAButton
                    onClick={() => saveOrAddEventTemplate()}
                    buttonType="primary"
                    data-testid="template-form-save"
                    type="submit"
                    disabled={!validateEventTemplateFields()}
                  >
                    {eventTemplateFormState.saveOrAddActionText}
                  </GoAButton>
                </>
              }
            />
            <PreviewTemplateContainer>
              <PreviewTemplate
                subjectTitle="Subject"
                emailTitle="Email preview"
                subjectPreviewContent={DOMPurify.sanitize(subjectPreview)}
                emailPreviewContent={DOMPurify.sanitize(bodyPreview)}
              />
            </PreviewTemplateContainer>
          </NotificationTemplateEditorContainer>
        </ModalContent>
      </Modal>

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

const SmallText = styled.div`
  font-size: small;
`;

const EventButtonWrapper = styled.div`
  text-align: center;
  margin: 19px 0;
`;

const MailButton = styled.div`
  max-width: 32px;
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

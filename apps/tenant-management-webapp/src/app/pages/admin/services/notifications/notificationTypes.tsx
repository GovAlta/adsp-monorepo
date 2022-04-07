import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton, GoACard } from '@abgov/react-components';
import { Grid, GridItem } from '@components/Grid';
import { NotificationTypeModalForm } from './edit';
import { EventModalForm } from './editEvent';
import { IndicatorWithDelay } from '@components/Indicator';
import * as handlebars from 'handlebars';
import { DeleteModal } from '@components/DeleteModal';

import { GoAIcon } from '@abgov/react-components/experimental';
import { FetchRealmRoles } from '@store/tenant/actions';
import { isDuplicatedNotificationName } from './validation';
import { generateMessage } from '@lib/handlebarHelper';
import { getTemplateBody } from '@core-services/notification-shared';
import MailIcon from '@assets/icons/mail-outline.svg';
//import Mail from '@assets/icons/mail.svg';
//import Chat from '@assets/icons/chat.svg';
//import Slack from '@assets/icons/slack.svg';
import { ReactComponent as Mail } from '@assets/icons/mail.svg';
import { ReactComponent as Slack } from '@assets/icons/slack.svg';
import { ReactComponent as Chat } from '@assets/icons/chat.svg';

import {
  UpdateNotificationTypeService,
  DeleteNotificationTypeService,
  FetchNotificationConfigurationService,
  FetchCoreNotificationTypesService,
} from '@store/notification/actions';
import { NotificationItem, baseTemplate, Template, EventItem } from '@store/notification/models';
import { RootState } from '@store/index';
import styled from 'styled-components';
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
import { useDebounce } from '@lib/useDebounce';
import { subscriberAppUrlSelector } from './selectors';

const emptyNotificationType: NotificationItem = {
  name: '',
  description: '',
  events: [],
  subscriberRoles: [],
  // TODO: This is hardcoded to email for now. Needs to be updated after additional channels are supported in the UI.
  channels: [],
  id: null,
  publicSubscribe: false,
  customized: false,
};

const emptyEvent: EventItem = {
  name: '',
  namespace: '',
  templates: baseTemplate,
  customized: false,
};

interface ParentCompProps {
  activeEdit?: boolean;
  activateEdit?: (boolean) => void;
}

export const NotificationTypes: FunctionComponent<ParentCompProps> = ({ activeEdit, activateEdit }) => {
  const [editType, setEditType] = useState(false);
  const [selectedType, setSelectedType] = useState(emptyNotificationType);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showEventDeleteConfirmation, setShowEventDeleteConfirmation] = useState(false);
  const [coreEvent, setCoreEvent] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateEditErrors, setTemplateEditErrors] = useState({
    subject: '',
    body: '',
  });
  const TEMPALTE_RENDER_DEBOUNCE_TIMER = 500; // ms
  const syntaxErrorMessage = 'Cannot render the code, please fix the syntax error in the input field';
  const notification = useSelector((state: RootState) => state.notification);
  const coreNotification = useSelector((state: RootState) => state.notification.core);
  const [formTitle, setFormTitle] = useState<string>('');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState<Template>(baseTemplate);
  const [savedTemplates, setSavedTemplates] = useState<Template>(baseTemplate);
  const debouncedRenderSubject = useDebounce(subject, TEMPALTE_RENDER_DEBOUNCE_TIMER);
  const debouncedRenderBody = useDebounce(body, TEMPALTE_RENDER_DEBOUNCE_TIMER);

  const [subjectPreview, setSubjectPreview] = useState('');
  const [bodyPreview, setBodyPreview] = useState('');
  const [currentChannel, setCurrentChannel] = useState('email');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  const tenant = useSelector((state: RootState) => ({ name: state.tenant?.name, realm: state.session.realm }));
  const eventDefinitions = useSelector((state: RootState) => state.event.definitions);
  const eventDef = eventDefinitions[`${selectedEvent?.namespace}:${selectedEvent?.name}`];

  const subscriberAppUrl = useSelector(subscriberAppUrlSelector);
  const htmlPayload = dynamicGeneratePayload(tenant, eventDef, subscriberAppUrl);
  const serviceName = `${selectedEvent?.namespace}:${selectedEvent?.name}`;

  const getEventSuggestion = () => {
    if (eventDef) {
      return convertToSuggestion(eventDef);
    }
    return [];
  };

  const channelNames = { email: 'Email', bot: 'Slack bot', sms: 'Text message' };
  const channelIcons = {
    email: <Mail style={{ color: '#666666' }} />,
    sms: <Chat style={{ color: '#666666' }} />,
    bot: <Slack style={{ color: '#666666' }} />,
  };

  useEffect(() => {
    // if an event is selected for editing
    if (selectedEvent) {
      //setSubject(selectedEvent?.templates?.email?.subject);
      //setBody(selectedEvent?.templates?.email?.body);

      console.log(JSON.stringify(selectedEvent) + '<selectedEvent');

      setTemplates(selectedEvent?.templates);
      setSavedTemplates(JSON.parse(JSON.stringify(selectedEvent?.templates)));

      // try to render preview of subject and body.
      // Will only load if the subject and body is a valid handlebar template
      console.log(JSON.stringify(Object.keys(selectedEvent.templates)[0]) + '<Object.keys(selectedEvent.templates)[0]');
      const channel = currentChannel; //selectedType.channels[0];
      const template = selectedEvent?.templates[channel];
      console.log(JSON.stringify(channel) + '<channelchannel');
      try {
        setSubjectPreview('');
        const x = generateMessage(getTemplateBody(template.body, channel, htmlPayload), htmlPayload);
        setBodyPreview(x);
        setTemplateEditErrors({
          ...templateEditErrors,
          body: '',
        });
      } catch (e) {
        console.log(JSON.stringify(e.message) + '<e.message body');
        setTemplateEditErrors({
          ...templateEditErrors,
          body: syntaxErrorMessage,
        });
      }
      try {
        setSubjectPreview(generateMessage(template.subject, htmlPayload));
        setTemplateEditErrors({
          ...templateEditErrors,
          subject: '',
        });
      } catch (e) {
        console.log(JSON.stringify(e.message) + '<e.message subject');
        setTemplateEditErrors({
          ...templateEditErrors,
          subject: syntaxErrorMessage,
        });
      }
    }
  }, [selectedEvent]);

  useEffect(() => {
    dispatch(FetchNotificationConfigurationService());
    dispatch(FetchRealmRoles());
  }, [dispatch]);

  useEffect(() => {
    if (notification?.notificationTypes !== undefined) {
      dispatch(FetchCoreNotificationTypesService());
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
    setErrors({});
  }

  useEffect(() => {
    if (activeEdit) {
      setSelectedType(emptyNotificationType);
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

  useEffect(() => {
    console.log(JSON.stringify(debouncedRenderBody) + '>>debouncedRenderBody');
    renderBodyPreview(debouncedRenderBody);
  }, [debouncedRenderBody]);

  useEffect(() => {
    console.log(JSON.stringify(debouncedRenderSubject) + '>>debouncedRenderSubject');
    renderSubjectPreview(debouncedRenderSubject);
  }, [debouncedRenderSubject]);

  const renderSubjectPreview = (value) => {
    console.log(JSON.stringify(value) + '<rendersubjectpreview');
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
  };

  const renderBodyPreview = (value) => {
    try {
      console.log(JSON.stringify(currentChannel) + '<currentChannel');
      const msg = generateMessage(getTemplateBody(value, currentChannel, htmlPayload), htmlPayload);
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
  };

  const nonCoreCopiedNotifications: Record<string, NotificationItem> = Object.assign(
    {},
    notification?.notificationTypes
  );

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
  delete nonCoreCopiedNotifications.manageSubscribe;

  const saveOrAddEventTemplate = () => {
    const definitionEventIndex = selectedType?.events?.findIndex(
      (def) => `${def.namespace}:${def.name}` === `${selectedEvent.namespace}:${selectedEvent.name}`
    );
    if (definitionEventIndex > -1) {
      selectedType.events[definitionEventIndex] = {
        ...selectedEvent,
        templates: templates,
      };
    }
    if (dispatch(UpdateNotificationTypeService(selectedType))) {
      setSavedTemplates(templates);
    }
  };

  const saveAndReset = () => {
    saveOrAddEventTemplate();
    reset();
  };

  const editEventTemplateContent = {
    saveOrAddActionText: 'Save',
    cancelOrBackActionText: 'Cancel',
    mainTitle: 'Edit a',
  };
  const addNewEventTemplateContent = {
    saveOrAddActionText: 'Add',
    cancelOrBackActionText: 'Back',
    mainTitle: 'Add a',
  };
  const [eventTemplateFormState, setEventTemplateFormState] = useState(addNewEventTemplateContent);

  const eventTemplateEditHintText =
    "*GOA default header and footer wrapper is applied if the template doesn't include proper <html> opening and closing tags";
  const validateEventTemplateFields = () => {
    // if (subject.length === 0 || body.length === 0) {
    //   return false;
    // }
    // if (templateEditErrors.subject || templateEditErrors.body) {
    //   return false;
    // }
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
    <NotificationStyles>
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
            setSelectedEvent(emptyEvent);
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
                      <div data-testid="type-id" className="minimumLineHeight">
                        Type ID: {notificationType.id}
                      </div>
                      {notificationType?.subscriberRoles && (
                        <div data-testid="tenant-subscriber-roles">
                          Subscriber roles:{' '}
                          <b>
                            {notificationType?.subscriberRoles
                              .filter((value) => value !== 'anonymousRead')
                              .map(
                                (roles, ix) => roles + (notificationType.subscriberRoles.length - 1 === ix ? '' : ', ')
                              )}{' '}
                          </b>
                        </div>
                      )}
                    </div>
                    <div>
                      <div data-testid="tenant-public-subscription" className="minimumLineHeight">
                        Public subscription: {notificationType.publicSubscribe ? 'yes' : 'no'}
                      </div>
                      <div data-testid="tenant-self-service">
                        Self-service allowed: {notificationType.manageSubscribe ? 'yes' : 'no'}
                      </div>
                    </div>
                  </div>
                </div>
              }
              description={`Description: ${notificationType.description}`}
            >
              <h2>Events:</h2>

              <Grid>
                {notificationType.events.map((event, key) => (
                  <GridItem key={key} md={6} vSpacing={1} hSpacing={0.5}>
                    <EventBorder>
                      <div className="flex columnFlex" style={{ height: '168px' }}>
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
                        <div style={{ marginTop: 'auto' }}>
                          <div className="flex1 flex endAlign">
                            <div className="flex3 endAlign">
                              <div style={{ display: 'flex', flexDirection: 'row' }}>
                                {notificationType.channels.map((channel) => (
                                  <div style={{ height: '23px', margin: '0 9px 0 9px', flex: '1' }}>
                                    {channelIcons[channel]}
                                    {(event.templates[channel].subject.length === 0 ||
                                      event.templates[channel].body.length === 0) && (
                                      <div className="icon-badge">!</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex3" style={{ textAlignLast: 'right' }}>
                              <a
                                data-testid="edit-event"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setSelectedType(notificationType);
                                  setEventTemplateFormState(editEventTemplateContent);
                                  setShowTemplateForm(true);
                                  setCoreEvent(false);
                                  setCurrentChannel(notificationType.channels[0]);
                                }}
                              >
                                Edit
                              </a>
                            </div>
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
                        data-testid="add-event"
                        onClick={() => {
                          setSelectedEvent(emptyEvent);
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
                <div>
                  <div className="rowFlex">
                    <h2 className="flex1">{notificationType.name}</h2>
                  </div>
                  <div className="rowFlex smallFont">
                    <div className="flex1">
                      <div data-testid="type-id" className="minimumLineHeight">
                        Type ID: {notificationType.id}
                      </div>
                      {notificationType?.subscriberRoles && (
                        <div data-testid="core-subscriber-roles">
                          Subscriber roles:{' '}
                          <b>
                            {notificationType?.subscriberRoles
                              .filter((value) => value !== 'anonymousRead')
                              .map(
                                (roles, ix) => roles + (notificationType.subscriberRoles.length - 1 === ix ? '' : ', ')
                              )}{' '}
                          </b>
                        </div>
                      )}
                    </div>
                    <div>
                      <div data-testid="core-public-subscription" className="minimumLineHeight">
                        Public subscription: {notificationType.publicSubscribe ? 'yes' : 'no'}
                      </div>
                      <div data-testid="core-self-service">
                        Self-service allowed: {notificationType.manageSubscribe ? 'yes' : 'no'}
                      </div>
                    </div>
                  </div>
                </div>
              }
              description={`Description: ${notificationType.description}`}
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
                                <img src={MailIcon} alt="non-interactive email icon" data-testid="icon-mail" />
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
              //subject={subject}
              templates={templates}
              initialChannel={currentChannel}
              validChannels={selectedType.channels}
              serviceName={serviceName}
              onSubjectChange={(value, channel) => {
                console.log(JSON.stringify(value) + 'value');
                console.log(JSON.stringify(channel) + 'value');
                console.log(JSON.stringify(templates) + 'templates');
                console.log(JSON.stringify(templates[channel]) + 'templates[channel]');
                let newTemplates = templates;
                if (templates[channel]) {
                  newTemplates[channel].subject = value;
                } else {
                  newTemplates = { ...templates, [channel]: { subject: value } };
                }

                console.log(JSON.stringify(newTemplates) + 'newTemplates');
                setTemplates(newTemplates);
                setSubject(value);
              }}
              subjectEditorConfig={subjectEditorConfig}
              bodyTitle="Body"
              onBodyChange={(value, channel) => {
                //setBody(value);
                let newTemplates = templates;
                if (templates[channel]) {
                  newTemplates[channel].body = value;
                } else {
                  newTemplates = { ...templates, [channel]: { body: value } };
                }

                setTemplates(newTemplates);
                setBody(value);
              }}
              setPreview={(channel) => {
                console.log(JSON.stringify(channel) + '<channelaaa');
                if (templates) {
                  console.log(JSON.stringify(templates[channel]) + '<templates[channel]xxx');
                  setBodyPreview(
                    generateMessage(getTemplateBody(templates[channel]?.body, channel, htmlPayload), htmlPayload)
                  );
                  setSubjectPreview(generateMessage(templates[channel]?.subject, htmlPayload));
                }
                setCurrentChannel(channel);
              }}
              bodyEditorConfig={bodyEditorConfig}
              errors={templateEditErrors}
              bodyEditorHintText={eventTemplateEditHintText}
              eventSuggestion={getEventSuggestion()}
              saveCurrentTemplate={() => saveOrAddEventTemplate()}
              resetToSavedAction={() => {
                console.log(JSON.stringify(savedTemplates) + '<savedTemplate');
                setTemplates(JSON.parse(JSON.stringify(savedTemplates)));
              }}
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
                    onClick={() => saveAndReset()}
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
                channelTitle={`${channelNames[currentChannel]} preview`}
                subjectPreviewContent={subjectPreview}
                emailPreviewContent={bodyPreview}
              />
            </PreviewTemplateContainer>
          </NotificationTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </NotificationStyles>
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
  border: 1px solid #666666;
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

const NotificationStyles = styled.div`
  .smallFont {
    font-size: 12px;
  }

  svg {
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

  .height-120 {
    height: 120px;
  }

  .flex {
    display: flex;
  }

  .flex1 {
    flex: 1;
  }

  .flex3 {
    flex: 3;
  }

  .flex4 {
    flex: 4;
  }

  .flex5 {
    flex: 5;
  }

  .padding {
    padding: 20px;
  }

  .smallPadding {
    padding: 3px;
  }

  .mail-outline {
    padding: 0px 3px;
  }

  .flexEndAlign {
    align-items: flex-end;
  }

  .endAlign {
    align-self: end;
  }

  .rightAlignEdit {
    text-align: end;
    width: 100%;
  }
  .noCursor {
    cursor: default;
  }

  .minimumLineHeight {
    line-height: 0.75rem;
  }

  .icon-badge-group .icon-badge-container {
    display: inline-block;
    margin-left: 15px;
  }

  .icon-badge-group .icon-badge-container:first-child {
    margin-left: 0;
  }

  .icon-badge-container {
    margin-top: 20px;
    position: relative;
  }

  .icon-badge-icon {
    font-size: 30px;
    position: relative;
  }

  .icon-badge {
    background-color: red;
    font-size: 12px;
    font-weight: 700;
    color: white;
    text-align: center;
    width: 18px;
    height: 18px;
    border-radius: 45%;
    position: relative;
    top: -35px;
    left: 17px;
  }
`;

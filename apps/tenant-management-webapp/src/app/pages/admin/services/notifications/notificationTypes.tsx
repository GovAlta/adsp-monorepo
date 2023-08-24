import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components-new';
import { GoAContainer } from '@abgov/react-components-new';
import { Grid, GridItem } from '@components/Grid';
import { NotificationTypeModalForm } from './addEditNotification/addEditNotification';
import { EventModalForm } from './editEvent';
import { IndicatorWithDelay } from '@components/Indicator';
import * as handlebars from 'handlebars';
import { DeleteModal } from '@components/DeleteModal';

import { GoAIcon } from '@abgov/react-components/experimental';
import { FetchRealmRoles } from '@store/tenant/actions';

import { generateMessage } from '@lib/handlebarHelper';
import { getTemplateBody } from '@core-services/notification-shared';
import { hasXSS } from '@lib/sanitize';
import { ReactComponent as Mail } from '@assets/icons/mail.svg';
import { ReactComponent as Slack } from '@assets/icons/slack.svg';
import { ReactComponent as Chat } from '@assets/icons/chat.svg';
import { XSSErrorMessage } from '@lib/sanitize';
import {
  UpdateNotificationTypeService,
  DeleteNotificationTypeService,
  FetchNotificationConfigurationService,
  FetchCoreNotificationTypesService,
} from '@store/notification/actions';
import { NotificationItem, baseTemplate, Template, EventItem } from '@store/notification/models';
import { RootState } from '@store/index';

import { EditIcon } from '@components/icons/EditIcon';

import {
  PreviewTemplateContainer,
  NotificationTemplateEditorContainer,
  Modal,
  BodyGlobalStyles,
  ModalContent,
} from './previewEditor/styled-components';
import { TemplateEditor } from './previewEditor/TemplateEditor';
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { dynamicGeneratePayload } from '@lib/dynamicPlaceHolder';
import { convertToSuggestion } from '@lib/autoComplete';
import { useDebounce } from '@lib/useDebounce';
import { subscriberAppUrlSelector } from './selectors';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { tenantRolesAndClients } from '@store/sharedSelectors/roles';
import {
  Buttons,
  NotificationBorder,
  EventBorder,
  EventButtonWrapper,
  MaxHeight,
  NotificationStyles,
  DescriptionText,
} from './styled-components';

const emptyNotificationType: NotificationItem = {
  name: '',
  description: '',
  events: [],
  subscriberRoles: [],
  // TODO: This is hardcoded to email for now. Needs to be updated after additional channels are supported in the UI.
  channels: [],
  sortedChannels: [],
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
  const templateDefaultError = {
    subject: '',
    body: '',
  };
  const [templateEditErrors, setTemplateEditErrors] = useState(templateDefaultError);
  const TEMPLATE_RENDER_DEBOUNCE_TIMER = 500; // ms
  const XSS_CHECK_RENDER_DEBOUNCE_TIMER = 2000; //ms
  const syntaxErrorMessage = 'Cannot render the code, please fix the syntax error in the input field';
  const notification = useSelector((state: RootState) => state.notification);
  const coreNotification = useSelector((state: RootState) => state.notification.core);
  const [formTitle, setFormTitle] = useState<string>('');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState<Template>(baseTemplate);
  const [savedTemplates, setSavedTemplates] = useState<Template>(baseTemplate);
  const debouncedRenderSubject = useDebounce(subject, TEMPLATE_RENDER_DEBOUNCE_TIMER);
  const debouncedRenderBody = useDebounce(body, TEMPLATE_RENDER_DEBOUNCE_TIMER);
  const debouncedXssCheckRenderSubject = useDebounce(subject, XSS_CHECK_RENDER_DEBOUNCE_TIMER);
  const debouncedXssCheckRenderBody = useDebounce(body, XSS_CHECK_RENDER_DEBOUNCE_TIMER);

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
  const contact = useSelector((state: RootState) => state.notification.supportContact);
  const tenantClientsRoles = useSelector(tenantRolesAndClients);

  const getEventSuggestion = () => {
    if (eventDef) {
      return convertToSuggestion(eventDef);
    }
    return [];
  };

  const indicator = useSelector((state: RootState) => {
    return state.session.indicator;
  });

  const channelNames = { email: 'Email', bot: 'Bot', sms: 'SMS' };
  const channelIcons = {
    email: <Mail style={{ color: '#666666' }} />,
    sms: <Chat style={{ color: '#666666' }} />,
    bot: <Slack style={{ color: '#666666' }} />,
  };

  useEffect(() => {
    // if an event is selected for editing
    if (selectedEvent) {
      setTemplates(selectedEvent?.templates);
      setSavedTemplates(JSON.parse(JSON.stringify(selectedEvent?.templates)));

      // try to render preview of subject and body.
      // Will only load if the subject and body is a valid handlebar template
      const template = selectedEvent?.templates[currentChannel];

      try {
        setSubjectPreview('');
        const combinedPreview = template?.body
          ? ('<style>' + template?.additionalStyles + '</style>').concat(template?.body)
          : template?.body;
        const bodyPreview = generateMessage(getTemplateBody(combinedPreview, currentChannel, htmlPayload), htmlPayload);
        setBodyPreview(bodyPreview);
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
        setSubjectPreview(generateMessage(template?.subject, htmlPayload));
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
  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  useEffect(() => {
    dispatch(FetchNotificationConfigurationService());
    dispatch(fetchKeycloakServiceRoles());
    dispatch(FetchRealmRoles());
  }, [dispatch]);

  useEffect(() => {
    dispatch(FetchCoreNotificationTypesService());
  }, [notification?.notificationTypes]);

  function reset(closeEventModal?: boolean) {
    setShowTemplateForm(false);
    setEventTemplateFormState(addNewEventTemplateContent);
    setEditType(false);
    if (closeEventModal) {
      setEditEvent(null);
    }
    setTemplateEditErrors(templateDefaultError);
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
    renderBodyPreview(debouncedRenderBody);
  }, [debouncedRenderBody, setBodyPreview]);

  useEffect(() => {
    if (hasXSS(debouncedXssCheckRenderBody)) {
      setTemplateEditErrors({
        ...templateEditErrors,
        body: XSSErrorMessage,
      });
    }
  }, [debouncedXssCheckRenderBody]);

  useEffect(() => {
    if (hasXSS(debouncedXssCheckRenderSubject)) {
      setTemplateEditErrors({
        ...templateEditErrors,
        subject: XSSErrorMessage,
      });
    }
  }, [debouncedXssCheckRenderSubject]);

  useEffect(() => {
    renderSubjectPreview(debouncedRenderSubject);
  }, [debouncedRenderSubject, setSubjectPreview]);

  const renderSubjectPreview = (value) => {
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

  const saveAndReset = (closeEventModal?: boolean) => {
    saveOrAddEventTemplate();
    reset(closeEventModal);
  };

  const editEventTemplateContent = {
    saveOrAddActionText: 'Save all',
    cancelOrBackActionText: 'Close',
    mainTitle: 'Edit a',
  };
  const addNewEventTemplateContent = {
    saveOrAddActionText: 'Add',
    cancelOrBackActionText: 'Back',
    mainTitle: 'Add a',
  };
  const [eventTemplateFormState, setEventTemplateFormState] = useState(addNewEventTemplateContent);

  const validateEventTemplateFields = () => {
    try {
      handlebars.parse(body);
      handlebars.parse(subject);
      const xssTemplate = templateEditErrors?.subject !== '' || templateEditErrors?.body !== '';
      return true && !xssTemplate;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <NotificationStyles>
      <div>
        <p>
          Notification types represent a bundled set of notifications that can be subscribed to. For example, an
          ‘Application Progress’ type could include notifications for submission of the application, processing started,
          and application processed.
        </p>
        <p>
          A subscriber has a subscription to the whole set and cannot subscribe to individual notifications in the set.
        </p>
      </div>
      <Buttons>
        <GoAButton
          testId="add-notification"
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
        Object.values(nonCoreCopiedNotifications)
          .sort((a, b) => (a.name < b.name ? -1 : 1))
          .map((notificationType) => (
            <div className="topBottomMargin" key={`notification-list-${notificationType.id}`}>
              <GoAContainer accent="thin" type="interactive">
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
                        <NotificationBorder className="smallPadding flex">
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
                            {!notificationType.publicSubscribe &&
                              notificationType?.subscriberRoles
                                .filter((value) => value !== 'anonymousRead')
                                .map(
                                  (roles, ix) =>
                                    roles + (notificationType.subscriberRoles.length - 1 === ix ? '' : ', ')
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
                <DescriptionText>{`Description: ${notificationType.description}`}</DescriptionText>
                <h2>Events:</h2>

                <Grid>
                  {notificationType.events
                    .sort((a, b) => (a.name < b.name ? -1 : 1))
                    .map((event, key) => (
                      <GridItem key={key} md={6} vSpacing={1} hSpacing={0.5}>
                        <EventBorder>
                          <div className="flex columnFlex gridBoxHeight">
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
                            <div className="marginTopAuto">
                              <div className="flex1 flex endAlign">
                                <div className="flex3 endAlign">
                                  <div className="flex rowFlex">
                                    {notificationType.sortedChannels.map((channel) => (
                                      <div
                                        key={channel}
                                        className="nonCoreIconPadding flex1"
                                        data-testid={`tenant-${channel}-channel`}
                                      >
                                        {channelIcons[channel]}
                                        {(event.templates[channel]?.subject?.length === 0 ||
                                          event.templates[channel]?.body?.length === 0) && (
                                          <div className="icon-badge" data-testid={`tenant-${channel}-channel-badge`}>
                                            !
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex3 textAlignLastRight">
                                  <a
                                    data-testid="edit-event"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setSelectedType(notificationType);
                                      setEventTemplateFormState(editEventTemplateContent);
                                      setShowTemplateForm(true);
                                      setCoreEvent(false);
                                      setCurrentChannel(notificationType.sortedChannels[0]);
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
                          type="secondary"
                          testId="add-event"
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
              </GoAContainer>
            </div>
          ))}
      <h2>Core notifications:</h2>
      {coreNotification &&
        Object.values(coreNotification).map((notificationType) => (
          <div className="topBottomMargin" key={`notification-list-${notificationType.id}`}>
            <GoAContainer accent="thin" type="interactive">
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
              <DescriptionText>{`Description: ${notificationType.description}`}</DescriptionText>
              <h2>Events:</h2>

              <Grid>
                {notificationType?.events?.map((event, key) => (
                  <GridItem key={key} md={6} vSpacing={1} hSpacing={0.5}>
                    <EventBorder>
                      <MaxHeight height={168}>
                        <div className="flex columnFlex gridBoxHeight">
                          <div className="rowFlex">
                            <div className="flex1">
                              {event.namespace}:{event.name}
                            </div>
                          </div>
                          <div className="marginTopAuto">
                            <div className="flex1 flex endAlign">
                              <div className="flex5 endAlign">
                                <div className="flex rowFlex">
                                  {notificationType.sortedChannels.map((channel) => (
                                    <div
                                      key={channel}
                                      className="flex1 coreIconPadding"
                                      data-testid={`core-${channel}-channel`}
                                    >
                                      {channelIcons[channel]}
                                      {(event.templates[channel]?.subject?.length === 0 ||
                                        event.templates[channel]?.body?.length === 0) && (
                                        <div className="icon-badge" data-testid={`core-${channel}-channel-badge`}>
                                          !
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex4 textAlignLastRight">
                                {event.customized && (
                                  <a
                                    className="resetButton"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setSelectedType(notificationType);
                                      setCoreEvent(true);
                                      setShowEventDeleteConfirmation(true);
                                    }}
                                    data-testid="reset-button"
                                  >
                                    Reset
                                  </a>
                                )}
                                <a
                                  data-testid="edit-event"
                                  className="coreEditButton"
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setSelectedType(notificationType);
                                    setEventTemplateFormState(editEventTemplateContent);
                                    setShowTemplateForm(true);
                                    setCoreEvent(false);
                                    setCurrentChannel(notificationType.sortedChannels[0]);
                                  }}
                                >
                                  Edit
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </MaxHeight>
                    </EventBorder>
                  </GridItem>
                ))}
              </Grid>
            </GoAContainer>
          </div>
        ))}
      {indicator && indicator.show && <IndicatorWithDelay message="Loading..." pageLock={false} />}
      {/* Delete confirmation */}

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

      {/* Event delete confirmation */}

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

      {/* Form */}
      <NotificationTypeModalForm
        open={editType}
        initialValue={selectedType}
        title={formTitle}
        tenantClients={tenantClientsRoles.tenantClients}
        realmRoles={tenantClientsRoles.realmRoles}
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
          reset(true);
        }}
        onClickedOutside={() => {
          reset(true);
        }}
      />

      {/* Edit/Add event template for a notification */}
      <Modal open={showTemplateForm} data-testid="template-form">
        {/* Hides body overflow when the modal is up */}
        <BodyGlobalStyles hideOverflow={showTemplateForm} />
        <ModalContent>
          <NotificationTemplateEditorContainer>
            <TemplateEditor
              modelOpen={showTemplateForm}
              mainTitle={eventTemplateFormState.mainTitle}
              templates={templates}
              initialChannel={currentChannel}
              validChannels={selectedType.sortedChannels}
              serviceName={serviceName}
              onSubjectChange={(value, channel) => {
                let newTemplates = templates;
                if (templates[channel]) {
                  newTemplates[channel].subject = value;
                } else {
                  newTemplates = { ...templates, [channel]: { subject: value } };
                }
                setTemplates(newTemplates);
                setSubject(value);
              }}
              onBodyChange={(value, channel) => {
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
                if (templates && templates[channel] && templates[channel]?.additionalStyles) {
                  const combinedPreview = ('<style>' + templates[channel]?.additionalStyles + '</style>').concat(
                    templates[channel]?.body
                  );
                  setBodyPreview(generateMessage(getTemplateBody(combinedPreview, channel, htmlPayload), htmlPayload));
                  setSubjectPreview(generateMessage(templates[channel]?.subject, htmlPayload));
                } else {
                  setBodyPreview(
                    generateMessage(getTemplateBody(templates[channel]?.body, channel, htmlPayload), htmlPayload)
                  );
                  setSubjectPreview(generateMessage(templates[channel]?.subject, htmlPayload));
                }
                setCurrentChannel(channel);
              }}
              errors={templateEditErrors}
              saveCurrentTemplate={() => saveOrAddEventTemplate()}
              resetToSavedAction={() => {
                setTemplates(JSON.parse(JSON.stringify(savedTemplates)));
                reset();
              }}
              saveAndReset={saveAndReset}
              validateEventTemplateFields={() => validateEventTemplateFields()}
              eventSuggestion={getEventSuggestion()}
              savedTemplates={savedTemplates}
              eventTemplateFormState={eventTemplateFormState}
            />
            <PreviewTemplateContainer>
              <PreviewTemplate
                channel={channelNames[currentChannel]}
                subjectPreviewContent={subjectPreview}
                bodyPreviewContent={bodyPreview}
                contactPhoneNumber={contact?.phoneNumber}
              />
            </PreviewTemplateContainer>
          </NotificationTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </NotificationStyles>
  );
};

export default NotificationTypes;

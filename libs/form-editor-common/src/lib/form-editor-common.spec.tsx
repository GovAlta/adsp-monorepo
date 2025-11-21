import { render } from '@testing-library/react';

import FormEditorCommon from './form-editor-common';
import { CalendarEvent } from './startEndDateEditor';
import { FileItem } from './PDFPreviewTemplateCore';

describe('FormEditorCommon', () => {
  it('should render Form Editor successfully', () => {
    const UpdateEventsByCalendarDispatch = (eventId: string, event: CalendarEvent) => {};
    const CreateEventsByCalendarDispatch = (event: CalendarEvent) => {};
    const DeleteCalendarEventDispatch = (eventId: string) => {};
    const updatePdfResponseDispatch = (fileList: FileItem[]) => {};
    const showCurrentFilePdfDispatch = (currentFileId: string) => {};
    const setPdfDisplayFileIdDispatch = (fileId: string) => {};
    const streamPdfSocketDispatch = (disconnect: false) => {};
    const FetchFileServiceDispatch = (fieldId: string) => {};

    const updateTempTemplateDispatch = (pdfTemplate: any) => {};
    const generatePdfDispatch = (payload: any) => {};
    const getCorePdfTemplatesDispatch = () => {};

    const DeleteFileServiceDispatch = (fileId: string) => {};
    const updateFormDefinitionDispatch = (definition: any) => {};
    const UploadFileServiceDispatch = (value: any) => {};
    const DownloadFileServiceDispatch = (file: any) => {};
    const UpdateSearchCriteriaAndFetchEventsDispatch = (record: any) => {};
    const ClearNewFileListDispatch = () => {};
    const getFormDefinitionsDispatch = () => {};
    const setDraftDataSchemaDispatch = (value: string) => {};
    const setDraftUISchemaDispatch = (value: string) => {};
    const renameActDispatch = (editActTarget: any, newName: any) => {};
    const setDefinition = (update: any) => {};

    const definitions = [
      {
        id: '1-aa-dcm',
        name: '1-aa-DCM',
        programName: 'Liquor Licensing',
        description: '',
        actsOfLegislation: [],
        anonymousApply: false,
        applicantRoles: ['urn:ads:platform:form-service:form-applicant'],
        assessorRoles: [],
        clerkRoles: [],
        dataSchema: {
          type: 'object',
          properties: {},
          required: [],
          allOf: [],
        },
        dispositionStates: [],
        formDraftUrlTemplate: 'https://form.adsp-dev.gov.ab.ca/autotest/1-aa-dcm',
        oneFormPerApplicant: true,
        queueTaskToProcess: {
          queueName: '',
          queueNameSpace: '',
        },
        scheduledIntakes: false,
        securityClassification: 'protected b',
        submissionPdfTemplate: 'submitted-form',
        submissionRecords: false,
        supportTopic: false,
        uiSchema: {
          type: 'Categorization',
          label: 'Vehicle Order Form',
          options: {},
          elements: [],
        },
      },
    ];

    const dataSchema = {
      type: 'object',
      properties: {
        txtUnitNo: {},
        numModelYear: {},
        cboMake: {},
        txtModel: {},
        txtClassCode: {},
      },
      required: [],
    };

    const definition = {
      id: '1-1-1-default-baseline-2',
      name: '1-1-1-default-baseline-2',
      description: '',
      ministry: 'affordability-and-utilities',
      registeredId: 'REG1',
      actsOfLegislation: ['act5', 'act4', 'act1', 'act27893'],
      anonymousApply: false,
      applicantRoles: ['urn:ads:platform:form-service:form-applicant', 'uma_authorization'],
      assessorRoles: [],
      clerkRoles: [],
      dataSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      dispositionStates: [],
      formDraftUrlTemplate: 'https://form.adsp-dev.gov.ab.ca/autotest/1-1-1-default-baseline-2',
      oneFormPerApplicant: true,
      programName: null,
      queueTaskToProcess: {
        queueName: '',
        queueNameSpace: '',
      },
      scheduledIntakes: true,
      securityClassification: 'protected b',
      submissionPdfTemplate: 'submitted-form',
      submissionRecords: false,
      supportTopic: true,
      uiSchema: {
        type: 'Group',
        label: 'Section 3: Current Vehicle Information',
        options: {},
        elements: [],
      },
    };

    const tempUiSchema = {
      type: 'Group',
      label: 'Section 3: Current Vehicle Information',
      options: {
        tooltip:
          'When ordering a replacement vehicle for a vehicle that will be cascaded for a 15 year old vehicle which will be returned to SAFMS, please list the 15 year old unit as the current unit, and list which vehicle is being cascaded in the rationale section. For more information, please contact your SAFMS coordinator.',
        tooltipPosition: 'right',
      },
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/txtUnitNo',
              options: {
                componentProps: {
                  style: {
                    width: '280px',
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/numModelYear',
              options: {
                componentProps: {
                  style: {
                    width: '140px',
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/cboMake',
              options: {
                componentProps: {
                  style: {
                    width: '220px',
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/txtModel',
              options: {
                componentProps: {
                  style: {
                    width: '240px',
                  },
                },
              },
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/txtClassCode',
              options: {
                componentProps: {
                  style: {
                    width: '180px',
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/txtOdometer',
              options: {
                componentProps: {
                  style: {
                    width: '180px',
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/vehicleOwnership',
              options: {
                radio: true,
                textForTrue: 'Ministry Owned (M)',
                textForFalse: 'SARTR Owned (C)',
                tooltip:
                  "This field can be determined by checking the 'ownership' field in Holman Insights.\nSARTR owned (C)\nMinistry owned (M)",
                tooltipPosition: 'right',
              },
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/txtCascade',
              options: {
                componentProps: {
                  style: {
                    width: '220px',
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/numCascadeModelYear',
              options: {
                componentProps: {
                  style: {
                    width: '140px',
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/cboCascadeMake',
              options: {
                componentProps: {
                  style: {
                    width: '220px',
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/txtCascadeModel',
              options: {
                componentProps: {
                  style: {
                    width: '240px',
                  },
                },
              },
            },
          ],
        },
      ],
    };

    const tempDataSchema = {
      type: 'object',
      properties: {
        txtUnitNo: {
          type: 'string',
          title: 'Unit d#',
        },
        numModelYear: {
          type: 'integer',
          title: 'Model Year',
        },
        cboMake: {
          type: 'string',
          title: 'Make',
        },
        txtModel: {
          type: 'string',
          title: 'Model',
        },
        txtClassCode: {
          type: 'string',
          title: 'Class Code',
        },
        txtOdometer: {
          type: 'string',
          title: 'Odometer',
        },
        vehicleOwnership: {
          type: 'boolean',
          title: 'Vehicle is',
        },
        txtCascade: {
          type: 'string',
          title: 'Cascade Unit number (if applicable)',
        },
        numCascadeModelYear: {
          type: 'integer',
          title: 'Cascade Model Year',
        },
        cboCascadeMake: {
          type: 'string',
          title: 'Cascade Make',
        },
        txtCascadeModel: {
          type: 'string',
          title: 'Cascade Model',
        },
      },
      required: [],
    };

    const indicator = {
      details: {
        'tenant/keycloak/service/roles/': 2,
      },
      message: 'Generating PDF...',
      show: true,
    };

    const securityClassification = {
      ProtectedA: 'protected a',
      ProtectedB: 'protected b',
      ProtectedC: 'protected c',
      Public: 'public',
    };

    const calendarEventDefault = {
      id: null,
      name: '',
      description: '',
      recordId: '',
      start: '2025-10-03T12:42:22.184-06:00',
      end: '2025-10-03T12:42:22.184-06:00',
      isAllDay: false,
      isPublic: false,
    };

    const { baseElement } = render(
      <FormEditorCommon
        key={'1'}
        definition={definition}
        roles={[]}
        queueTasks={{}}
        fileTypes={[]}
        isLoading={false}
        isSaving={false}
        tempUiSchema={JSON.stringify(tempUiSchema)}
        tempDataSchema={JSON.stringify(tempDataSchema)}
        setDefinition={setDefinition}
        formDefinitions={{}}
        schemaError={null}
        selectedCoreEvent={undefined}
        isFormUpdated={false}
        latestNotification={undefined}
        isLoadingRoles={false}
        newFileList={null}
        SecurityClassification={securityClassification}
        indicator={indicator}
        CalendarEventDefault={calendarEventDefault}
        formServiceApiUrl={'https://form.adsp-dev.gov.ab.ca'}
        DeleteFileService={DeleteFileServiceDispatch}
        updateFormDefinition={updateFormDefinitionDispatch}
        UploadFileService={UploadFileServiceDispatch}
        DownloadFileService={DownloadFileServiceDispatch}
        ClearNewFileList={ClearNewFileListDispatch}
        getFormDefinitions={getFormDefinitionsDispatch}
        setDraftDataSchema={setDraftDataSchemaDispatch}
        setDraftUISchema={setDraftUISchemaDispatch}
        UpdateSearchCriteriaAndFetchEvents={UpdateSearchCriteriaAndFetchEventsDispatch}
        dataSchema={dataSchema}
        renameAct={renameActDispatch}
        definitions={definitions}
        defaultFormUrl={'https://form.adsp-dev.gov.ab.ca/autotest/1-1-1-default-baseline-2'}
        DeleteCalendarEvent={DeleteCalendarEventDispatch}
        CreateEventsByCalendar={CreateEventsByCalendarDispatch}
        UpdateEventsByCalendar={UpdateEventsByCalendarDispatch}
        streamPdfSocket={streamPdfSocketDispatch}
        showCurrentFilePdf={showCurrentFilePdfDispatch}
        setPdfDisplayFileId={setPdfDisplayFileIdDispatch}
        updatePdfResponse={updatePdfResponseDispatch}
        FetchFileService={FetchFileServiceDispatch}
        fileList={[]}
        pdfTemplate={undefined}
        jobList={[]}
        socketChannel={null}
        reloadFile={null}
        currentId={''}
        files={{}}
        pdfList={[]}
        updateTempTemplate={updateTempTemplateDispatch}
        generatePdf={generatePdfDispatch}
        getCorePdfTemplates={getCorePdfTemplatesDispatch}
        REALM_ROLE_KEY={0}
        error={null}
        registerData={null}
        nonAnonymous={false}
        dataList={{}}
        tenantName={"tenantName"}
      />
    );
    expect(baseElement).toBeTruthy();
  });
});

import React, { useRef, useState, useCallback } from 'react';
import styles from './Editor.module.scss';
import { useWindowDimensions } from '../../../utils/useWindowDimensions';
import {
  GoabFormItem,
  GoabInput,
  GoabButton,
  GoabDropdownItem,
  GoabCheckbox,
  GoabTooltip,
  GoabIcon,
  GoabModal,
  GoabDropdown,
  GoabButtonGroup, 
  GoabContainer,
  GoabAccordion
} from '@abgov/react-components';
import DataTable from '../../../components/DataTable';
import { FormDefinition } from '../../../state';
import { SecurityClassification } from '../../../state/types';
import { GoabCheckboxOnChangeDetail, GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
import { DispositionItems } from './dispositionItems';
import { AddEditDispositionModal } from './addEditDispositionModal';
import { Disposition } from '../../../state/types';
import def from 'ajv/dist/vocabularies/discriminator';

export interface LifeCycleContainerProps {
  definition: FormDefinition;
  errors: any;
  updateEditorFormDefinition: (update: Partial<FormDefinition>) => void;
  queueTasks: any;
  setIntakePeriodModal: (value: boolean) => void;
  intakePeriodModal: boolean;
  selectedCoreEvent: any;
}

const NO_TASK_CREATED_OPTION = `No task created`;

export const LifeCycleContainer: React.FC<LifeCycleContainerProps> = ({
  definition,
  errors,
  updateEditorFormDefinition,
  queueTasks,
  setIntakePeriodModal,
  intakePeriodModal,
  selectedCoreEvent,
}): JSX.Element => {
  const { height } = useWindowDimensions();

  const EditorHeight = height - 180;

  const isUseMiniMap = window.screen.availWidth >= 1920;

  const [showNew, setShowNew] = useState(false);

  const setDefinition = useCallback(
    (update: Partial<FormDefinition>) => {
      updateEditorFormDefinition(update);
    },
    [updateEditorFormDefinition]
  );

  const openModalFunction = (disposition) => {
    const currentDispositions = definition.dispositionStates;
    const dispIndex = currentDispositions.findIndex((disp) => disp.id === disposition.id);
    setSelectedEditModalIndex(dispIndex);
  };

  const updateDispositionFunction = (dispositionStates) => {
    setDefinition({ dispositionStates });
  };

  const openDeleteModalFunction = (disposition) => {
    const currentDispositions = definition.dispositionStates;
    const dispIndex = currentDispositions.findIndex((disp) => disp.id === disposition.id);
    setSelectedDeleteDispositionIndex(dispIndex);
  };

  const getDispositionForModal = () => {
    if (selectedEditModalIndex !== null) {
      return definition?.dispositionStates && definition.dispositionStates[selectedEditModalIndex];
    }
    return { id: '', name: '', description: '' } as Disposition;
  };

  const getQueueTaskToProcessValue = () => {
    let value = NO_TASK_CREATED_OPTION;

    if (definition.queueTaskToProcess) {
      const { queueNameSpace, queueName } = definition.queueTaskToProcess;
      if (queueNameSpace !== '' && queueName !== '') {
        value = `${queueNameSpace}:${queueName}`;
      } else {
        value = NO_TASK_CREATED_OPTION;
      }
    }

    return value;
  };

  const onSaveDispositionForModal = (
    newDisposition: boolean,
    currentDisposition: Disposition,
    definition: FormDefinition,
    selectedEditModalIndex: number | null
  ): [FormDefinition, number | null] => {
    const currentDispositionStates = [...definition.dispositionStates];
    console.log(JSON.stringify(newDisposition) + '<newDisposition');
    console.log(JSON.stringify(currentDisposition) + '<currentDisposition');
    console.log(JSON.stringify(definition) + '<definition');
    if (newDisposition) {
      if (currentDisposition) {
        currentDispositionStates.push(currentDisposition);
        console.log(JSON.stringify(currentDispositionStates) + '<currentDispositionStates');
        definition.dispositionStates = currentDispositionStates;

        console.log(JSON.stringify(definition) + '<definition 2');
      }
    } else {
      currentDispositionStates.splice(selectedEditModalIndex, 1);
      currentDispositionStates.push(currentDisposition);
      definition.dispositionStates = currentDispositionStates;
    }
    return [definition, null];
  };

  const [newDisposition, setNewDisposition] = useState<boolean>(false);
  const [selectedDeleteDispositionIndex, setSelectedDeleteDispositionIndex] = useState<number>(null);
  const [selectedEditModalIndex, setSelectedEditModalIndex] = useState<number>(null);

  return (
    <div>
      <div className={styles['life-cycle-container']}>
        <div className={styles['life-cycle-auto-scroll']} style={{ height: EditorHeight + 7 }}>
          <h3>Application</h3>
          <div>
            <GoabFormItem error={errors?.['formDraftUrlTemplate']} label="Form template URL">
              <div className={styles['formFormItem']}>
                <GoabInput
                  name="form-url-id"
                  value={definition?.formDraftUrlTemplate}
                  testId="form-url-id"
                  disabled={true}
                  width="100%"
                  onChange={null}
                />
              </div>
            </GoabFormItem>
            <div className={styles['flexRow']}>
              <div className={styles['goACheckboxPad']}>
                <GoabCheckbox
                  name="form-definition-anonymous-apply"
                  key="form-definition-anonymous-apply-checkbox"
                  checked={definition.anonymousApply === true}
                  onChange={(detail: GoabCheckboxOnChangeDetail) => {
                    setDefinition({ anonymousApply: detail.checked });
                  }}
                  text={'Allow anonymous application'}
                />
              </div>
              <GoabTooltip
                content={
                  definition.anonymousApply
                    ? 'Forms of this type will allow anonymous user to apply.'
                    : 'Forms of this type will not allow anonymous user to apply.'
                }
                position="top"
              >
                <GoabIcon type="information-circle" ariaLabel="anonymous-icon"></GoabIcon>
              </GoabTooltip>
            </div>
            <div className={styles['flexRow']}>
              <div className={styles['goACheckboxPad']}>
                <GoabCheckbox
                  name="form-definition-allow-multiple-forms-checkbox"
                  key="form-definition-allow-multiple-forms-checkbox"
                  disabled={definition.anonymousApply}
                  checked={
                    !(
                      definition.oneFormPerApplicant === true ||
                      definition.oneFormPerApplicant === undefined ||
                      definition.oneFormPerApplicant === null
                    )
                  }
                  onChange={(detail: GoabCheckboxOnChangeDetail) => {
                    setDefinition({ oneFormPerApplicant: !detail.value });
                  }}
                  text={'Allow multiple forms per applicant'}
                />
              </div>
              <GoabTooltip
                content={
                  definition.oneFormPerApplicant
                    ? 'Forms of this type will only allow applicants to have one form created and submitted at a time.'
                    : 'Forms of this type will allow applicants to have multiple forms be created and submitted at a time.'
                }
                position="top"
              >
                <GoabIcon type="information-circle" ariaLabel="allow-multiple-icon"></GoabIcon>
              </GoabTooltip>
            </div>
            <div className={styles['flexRow']}>
              <div className={styles['goACheckboxPad']}>
                <GoabCheckbox
                  name="support-topic"
                  key="support-topic"
                  disabled={definition.anonymousApply}
                  checked={definition.supportTopic}
                  testId="support-topic"
                  onChange={() => {
                    const supportTopic = definition.supportTopic ? false : true;
                    setDefinition({ supportTopic });
                  }}
                  text="Create support topic"
                />
              </div>
              <GoabTooltip
                content={
                  definition.supportTopic
                    ? 'Forms of this type will create a comment topic used for supporting applicants. Applicants will be able to read and write comments to the topic to interact with staff.'
                    : 'Forms of this type will not create a comment topic used for supporting applicants.'
                }
                position="top"
              >
                <GoabIcon type="information-circle" ariaLabel="support-topic-icon"></GoabIcon>
              </GoabTooltip>
            </div>
            <div className={styles['flexRow']}>
              <div className={styles['goACheckboxPad']}>
                <GoabCheckbox
                  name="form-definition-scheduled-intakes-checkbox"
                  key="form-definition-scheduled-intakes-checkbox"
                  checked={definition.scheduledIntakes}
                  onChange={(detail: GoabCheckboxOnChangeDetail) => {
                    setDefinition({ scheduledIntakes: detail.checked });
                  }}
                  text={'Use scheduled intakes'}
                />
              </div>
              <GoabTooltip
                content={
                  definition.scheduledIntakes
                    ? 'Forms of this type will have a timeframe to complete and submit a form.'
                    : 'Forms of this type will not have a timeframe to complete and submit a form.'
                }
                position="top"
              >
                <GoabIcon type="information-circle" ariaLabel="scheduled-icon"></GoabIcon>
              </GoabTooltip>
            </div>
            {definition.scheduledIntakes && (
              <div style={{ marginBottom: '0.5rem' }}>
                <GoabButton
                  type="primary"
                  testId="set-intake-period"
                  onClick={() => {
                    setIntakePeriodModal(true);
                  }}
                >
                  Intake periods
                </GoabButton>
              </div>
            )}
          </div>
          <div>
            <GoabFormItem error={''} label="Security classification">
              {/* The style below is to fix an UI component bug */}
              <div style={{ paddingLeft: '3px' }}>
                <GoabDropdown
                  name="securityClassifications"
                  width="25rem"
                  value={definition?.securityClassification || ''}
                  onChange={(detail: GoabDropdownOnChangeDetail) => {
                    setDefinition({ securityClassification: detail.value as SecurityClassification });
                  }}
                >
                  <GoabDropdownItem value={SecurityClassification.Public} label="Public" />
                  <GoabDropdownItem value={SecurityClassification.ProtectedA} label="Protected A" />
                  <GoabDropdownItem value={SecurityClassification.ProtectedB} label="Protected B" />
                  <GoabDropdownItem value={SecurityClassification.ProtectedC} label="Protected C" />
                </GoabDropdown>
              </div>
            </GoabFormItem>
          </div>
          <h3 className={styles['h3']}>Submission</h3>
          <div className={styles['flexRow']}>
            <div className={styles['submissionRecordsBox']}>
              <GoabCheckbox
                name="generate-pdf-on-submit"
                key="generate-pdf-on-submit"
                checked={definition.submissionPdfTemplate ? true : false}
                testId="generate-pdf-on-submit"
                onChange={() => {
                  const records = definition.submissionPdfTemplate ? '' : 'submitted-form';
                  setDefinition({ submissionPdfTemplate: records });
                }}
                text="Create PDF on submit"
              />
            </div>
            <GoabTooltip
              content={
                definition.submissionPdfTemplate
                  ? 'Forms of this type will generate a PDF on submission '
                  : 'Forms of this type will not generate a PDF on submission'
              }
              position="top"
            >
              <GoabIcon type="information-circle" ariaLabel="generate-pdf-icon"></GoabIcon>
            </GoabTooltip>
          </div>
          <div className={styles['flexRow']}>
            <div className={styles['submissionRecordsBox']}>
              <GoabCheckbox
                name="submission-records"
                key="submission-records"
                checked={definition.submissionRecords}
                testId="submission-records"
                onChange={() => {
                  console.log('clicked');
                  const records = definition.submissionRecords ? false : true;

                  console.log(JSON.stringify(records) + '<records');
                  setDefinition({ submissionRecords: records });
                }}
                text="Create submission records on submit"
              />
            </div>
            <GoabTooltip
              content={
                definition.submissionRecords
                  ? 'Forms of this type will create submission records. This submission record can be used for processing of the application and to record an adjudication decision (disposition state).'
                  : 'Forms of this type will not create a submission record when submitted. Applications are responsible for managing how forms are processed after they are submitted.'
              }
              position="top"
            >
              <GoabIcon type="information-circle" ariaLabel="submission-icon"></GoabIcon>
            </GoabTooltip>
          </div>
          <div style={{ background: definition.submissionRecords ? 'white' : '#f1f1f1' }}>
            <div className={styles['submissionConfigurationPadding']}>
              <h3 className={styles['h3Inline']}>Task queue to process</h3>
              <div className={styles['toolTipAdjust']}>
                {definition.submissionRecords && (
                  <GoabTooltip
                    content={
                      getQueueTaskToProcessValue() === NO_TASK_CREATED_OPTION
                        ? ' No task will be created for processing of the submissions. Applications are responsible for management of how submissions are worked on by users.'
                        : 'A task will be created in queue “{queue namespace + name}” for submissions of the form. This allows program staff to work on the submissions from the task management application using this queue.'
                    }
                  >
                    <GoabIcon type="information-circle" ariaLabel="queue"></GoabIcon>
                  </GoabTooltip>
                )}
              </div>
              <div className={styles['queueTaskDropdown']}>
                {queueTasks && Object.keys(queueTasks).length > 0 && (
                  <GoabDropdown
                    data-test-id="form-submission-select-queue-task-dropdown"
                    name="queueTasks"
                    disabled={!definition.submissionRecords}
                    value={[getQueueTaskToProcessValue()]}
                    onChange={(detail: GoabDropdownOnChangeDetail) => {
                      const separatedQueueTask = detail?.value?.split(':');
                      if (separatedQueueTask?.length || 0 > 1) {
                        setDefinition({
                          queueTaskToProcess: {
                            queueNameSpace: separatedQueueTask ? separatedQueueTask[0] : '',
                            queueName: separatedQueueTask ? separatedQueueTask[1] : '',
                          },
                        });
                      } else {
                        setDefinition({
                          queueTaskToProcess: {
                            queueNameSpace: '',
                            queueName: '',
                          },
                        });
                      }
                    }}
                  >
                    <GoabDropdownItem
                      data-testId={`task-Queue-ToCreate-DropDown`}
                      key={`No-Task-Created`}
                      value={NO_TASK_CREATED_OPTION}
                      label={NO_TASK_CREATED_OPTION}
                    />
                    {queueTasks &&
                      Object.keys(queueTasks)
                        .sort()
                        .map((item) => <GoabDropdownItem data-testId={item} key={item} value={item} label={item} />)}
                  </GoabDropdown>
                )}
              </div>
              <div className={styles['flexRow']}>
                <h3>Disposition states</h3>
                <div>
                  {definition.submissionRecords ? (
                    <GoabTooltip
                      content="Disposition states represent possible decisions applied to submissions by program staff. For example, an adjudicator may find that a submission is incomplete and records an Incomplete state with rationale of what information is missing."
                      position="top"
                    >
                      <GoabIcon type="information-circle" ariaLabel="disposition-icon"></GoabIcon>
                    </GoabTooltip>
                  ) : (
                    <div className={styles['fakeButton']} />
                  )}
                </div>
                <div className={styles['rightAlign']} />
                {definition.submissionRecords ? (
                  <GoabButton
                    type="secondary"
                    testId="Add state"
                    disabled={!definition.submissionRecords}
                    onClick={() => {
                      setNewDisposition(true);
                      setSelectedEditModalIndex(null);
                    }}
                  >
                    Add state
                  </GoabButton>
                ) : (
                  <div className={styles['fakeButton']} />
                )}
              </div>

              <div
                style={{
                  overflowY: 'auto',
                  zIndex: 0,
                }}
              >
                {definition.dispositionStates && definition.dispositionStates.length === 0 ? (
                  'No disposition states'
                ) : (
                  <DataTable>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Order</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {definition && (
                        <DispositionItems
                          openModalFunction={openModalFunction}
                          updateDispositions={updateDispositionFunction}
                          openDeleteModalFunction={openDeleteModalFunction}
                          dispositions={definition.dispositionStates}
                          submissionRecords={definition.submissionRecords}
                        />
                      )}
                    </tbody>
                  </DataTable>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddEditDispositionModal
        open={selectedEditModalIndex !== null || newDisposition}
        isEdit={selectedEditModalIndex !== null}
        existingDispositions={definition?.dispositionStates}
        initialValue={getDispositionForModal()}
        onSave={(currentDispositions) => {
          const [updatedDefinition, index] = onSaveDispositionForModal(
            newDisposition,
            currentDispositions,
            JSON.parse(JSON.stringify(definition)),
            selectedEditModalIndex
          );
          setDefinition(updatedDefinition);
          setSelectedDeleteDispositionIndex(index);
        }}
        onClose={() => {
          setNewDisposition(false);
          setSelectedEditModalIndex(null);
        }}
      />

      {intakePeriodModal && (
        <GoabModal heading="Intake Periods" open={intakePeriodModal} maxWidth={'70ch !important'}>
          <form style={{ width: '100%' }}>
            <div className={styles['Margin']}>
              <div>
                Use intake periods to control when applicants can access and submit this form. You can create one or
                more windows of time to match your application cycles.
              </div>
            </div>

            {selectedCoreEvent && selectedCoreEvent.length > 0
              ? selectedCoreEvent.map((coreEvent) => {
                  return (
                    <GoabAccordion heading={coreEvent.name} open={false}>
                      <StartEndDateEditor event={coreEvent} newEvent={false} closeIntake={() => null} />
                    </GoabAccordion>
                  );
                })
              : !showNew && <b>No intake periods configured for this form</b>}

            {showNew && (
              <div className={styles['Margin']}>
                <GoabContainer mt="m">
                  <StartEndDateEditor
                    formId={definition.id}
                    event={CalendarEventDefault}
                    closeIntake={() => setShowNew(false)}
                    newEvent={true}
                  />
                </GoabContainer>
              </div>
            )}
            {!showNew && (
              <div className={styles['Margin']}>
                <GoabButton type="primary" onClick={() => setShowNew(true)}>
                  New intake period
                </GoabButton>
              </div>
            )}
            <GoabButtonGroup alignment="end" mt="xl">
              <GoabButton
                type="secondary"
                disabled={showNew}
                onClick={() => {
                  setIntakePeriodModal(false);
                }}
              >
                Close
              </GoabButton>
            </GoabButtonGroup>
          </form>
        </GoabModal>
      )}
    </div>
  );
};

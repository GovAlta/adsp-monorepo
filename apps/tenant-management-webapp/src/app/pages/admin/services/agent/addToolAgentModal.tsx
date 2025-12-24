import { GoabButton, GoabButtonGroup, GoabModal, GoabFormItem, GoabTable, GoabCheckbox } from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { AgentConfiguration } from '@store/agent/model';
import { GoabCheckboxOnChangeDetail } from '@abgov/ui-components-common';

interface AddToolAgentModalProps {
  availableAgents: AgentConfiguration[];
  agents: string[];
  onCancel: () => void;
  onOK: (agents: string[]) => void;
  open: boolean;
}

export const AddToolAgentModal: FunctionComponent<AddToolAgentModalProps> = ({
  availableAgents,
  agents,
  onCancel,
  onOK,
  open,
}) => {
  const [selected, setSelected] = useState([] as string[]);

  useEffect(() => {
    setSelected(agents || []);
  }, [agents]);

  return (
    <GoabModal
      testId="add-tool-agent-modal"
      open={open}
      heading="Add agent"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" testId="tool-agent-modal-cancel" onClick={onCancel}>
            Cancel
          </GoabButton>

          <GoabButton
            type="primary"
            testId="tool-agent-modal-save"
            onClick={() => {
              onOK(selected);
            }}
          >
            OK
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <form>
        <GoabFormItem label="Select agents" mb="m">
          <GoabTable width="100%">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              {availableAgents.map(({ id, description }) => (
                <tr key={id}>
                  <td>
                    <div>{id}</div>
                    <p>{description}</p>
                  </td>
                  <td>
                    <GoabButtonGroup alignment="end">
                      <GoabCheckbox
                        name="selected"
                        checked={selected.includes(id)}
                        onChange={(detail: GoabCheckboxOnChangeDetail) => {
                          let update: string[];
                          if (detail.checked) {
                            update = [...selected, id];
                          } else {
                            update = [...selected];
                            const index = update.findIndex((tool) => tool === id);
                            if (index >= 0) {
                              update.splice(index, 1);
                            }
                          }
                          setSelected(update);
                        }}
                      />
                    </GoabButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </GoabTable>
        </GoabFormItem>
      </form>
    </GoabModal>
  );
};

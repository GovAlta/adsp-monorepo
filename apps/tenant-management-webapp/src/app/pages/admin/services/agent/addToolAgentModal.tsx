import { GoAButton, GoAButtonGroup, GoAModal, GoAFormItem, GoATable, GoACheckbox } from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { AgentConfiguration } from '@store/agent/model';

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
    <GoAModal
      testId="add-tool-agent-modal"
      open={open}
      heading="Add agent"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton type="secondary" testId="tool-agent-modal-cancel" onClick={onCancel}>
            Cancel
          </GoAButton>

          <GoAButton
            type="primary"
            testId="tool-agent-modal-save"
            onClick={() => {
              onOK(selected);
            }}
          >
            OK
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <form>
        <GoAFormItem label="Select agents" mb="m">
          <GoATable width="100%">
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
                    <GoAButtonGroup alignment="end">
                      <GoACheckbox
                        name="selected"
                        checked={selected.includes(id)}
                        onChange={(_, checked) => {
                          let update: string[];
                          if (checked) {
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
                    </GoAButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </GoATable>
        </GoAFormItem>
      </form>
    </GoAModal>
  );
};

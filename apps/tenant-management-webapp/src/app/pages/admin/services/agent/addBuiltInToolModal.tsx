import { GoAButton, GoAButtonGroup, GoAModal, GoAFormItem, GoATable, GoACheckbox } from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { ToolDescription } from '@store/agent/model';

interface AddBuiltInToolModalProps {
  availableTools: ToolDescription[];
  tools: string[];
  onCancel: () => void;
  onOK: (tools: string[]) => void;
  open: boolean;
}

export const AddBuiltInToolModal: FunctionComponent<AddBuiltInToolModalProps> = ({
  availableTools,
  tools,
  onCancel,
  onOK,
  open,
}) => {
  const [selected, setSelected] = useState([] as string[]);

  useEffect(() => {
    setSelected(tools || []);
  }, [tools]);

  return (
    <GoAModal
      testId="add-built-in-tool-modal"
      open={open}
      heading="Add built-in tool"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton type="secondary" testId="built-in-tool-modal-cancel" onClick={onCancel}>
            Cancel
          </GoAButton>

          <GoAButton
            type="primary"
            testId="built-in-tool-modal-save"
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
        <GoAFormItem label="Select tools" mb="m">
          <GoATable width="100%">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              {availableTools.map(({ id, description }) => (
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

import { GoabButton, GoabButtonGroup, GoabModal, GoabFormItem, GoabTable, GoabCheckbox } from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { ToolDescription } from '@store/agent/model';
import { GoabCheckboxOnChangeDetail } from '@abgov/ui-components-common';

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
    <GoabModal
      testId="add-built-in-tool-modal"
      open={open}
      heading="Add built-in tool"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" testId="built-in-tool-modal-cancel" onClick={onCancel}>
            Cancel
          </GoabButton>

          <GoabButton
            type="primary"
            testId="built-in-tool-modal-save"
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
        <GoabFormItem label="Select tools" mb="m">
          <GoabTable width="100%">
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

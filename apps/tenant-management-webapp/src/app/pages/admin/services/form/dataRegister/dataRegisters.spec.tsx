import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RegisterConfigData, RegisterDataType } from '@abgov/jsonforms-components';
import {
  createDataRegisterAction,
  deleteDataRegisterAction,
  getRegisterDataAction,
  UPDATE_DATA_REGISTER_ACTION,
  updateDataRegisterAction,
} from '@store/configuration/action';
import { LoadingState, LoadingStateType } from '@store/session/models';
import { DataRegisters } from './dataRegisters';

// Monaco loads its worker bundle from a CDN and cannot run in jsdom.
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: () => <div data-testid="monaco-editor-mock" />,
}));

interface MockAddModalProps {
  open: boolean;
  onSave: (data: RegisterDataType | null, name: string, description: string) => void;
  existingNames?: string[];
}

jest.mock('./addRegisterDataModal', () => ({
  AddRegisterDataModal: ({ open, onSave, existingNames }: MockAddModalProps) => (
    <div data-testid="add-modal-mock" data-open={String(open)} data-existing-names={existingNames?.join(',')}>
      <button data-testid="add-modal-save-without-data" onClick={() => onSave(null, 'provinces', 'Provinces')} />
    </div>
  ),
}));

const urnFor = (name: string) => `urn:ads:platform:configuration:v2:/configuration/data-register/${name}`;
const weekdays: RegisterConfigData = { urn: urnFor('weekdays'), description: 'Days of the week', data: ['Monday'] };
const colours: RegisterConfigData = { urn: urnFor('colours'), description: 'Colours', data: ['Red'] };

const mockStore = configureStore([]);
const createStore = (
  registers: RegisterConfigData[] | undefined,
  isFetchingRegisterData = false,
  loadingStates: LoadingState[] = [],
) => mockStore({ configuration: { registers, isFetchingRegisterData }, session: { loadingStates } });

const updateState = (state: LoadingStateType): LoadingState => ({
  name: UPDATE_DATA_REGISTER_ACTION,
  id: 'weekdays',
  state,
});

const renderDataRegisters = (store: ReturnType<typeof createStore>) =>
  render(
    <Provider store={store}>
      <DataRegisters />
    </Provider>,
  );

const click = (element: Element | null) => fireEvent(element as Element, new CustomEvent('_click'));
const byTestId = (baseElement: HTMLElement, tag: string, testId: string) =>
  baseElement.querySelector(`${tag}[testid='${testId}']`);

describe('DataRegisters', () => {
  it('fetches the registers when the tab is opened', () => {
    const store = createStore([]);

    renderDataRegisters(store);

    expect(store.getActions()).toEqual([getRegisterDataAction()]);
  });

  it('shows a spinner while the registers are fetched', () => {
    const { baseElement } = renderDataRegisters(createStore([], true));

    expect(baseElement.querySelector('goa-circular-progress')).not.toBeNull();
  });

  it('shows an empty message when there are no registers', () => {
    const { getByText } = renderDataRegisters(createStore(undefined));

    expect(getByText('No data registers')).toBeInTheDocument();
  });

  it('lists the registers sorted by name', () => {
    const { getAllByTestId } = renderDataRegisters(createStore([weekdays, colours]));

    expect(getAllByTestId('data-register-name').map((cell) => cell.textContent)).toEqual(['colours', 'weekdays']);
  });

  it('shows the URN of the register whose details are toggled on', () => {
    const { baseElement } = renderDataRegisters(createStore([weekdays]));

    click(byTestId(baseElement, 'goa-icon-button', 'data-register-details-weekdays'));

    expect(baseElement.querySelector('goa-badge')).toHaveAttribute('content', urnFor('weekdays'));
  });

  it('drops the selection of a register that is removed from state', () => {
    const { baseElement, rerender, queryByTestId } = renderDataRegisters(createStore([weekdays]));
    click(byTestId(baseElement, 'goa-icon-button', 'data-register-details-weekdays'));

    rerender(
      <Provider store={createStore([colours])}>
        <DataRegisters />
      </Provider>,
    );
    rerender(
      <Provider store={createStore([weekdays])}>
        <DataRegisters />
      </Provider>,
    );

    expect(queryByTestId('data-register-detail-weekdays')).toBeNull();
  });

  describe('copying the URN', () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

    afterEach(() => {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        delete (navigator as { clipboard?: Clipboard }).clipboard;
      }
    });

    it('copies the URN of the selected register', () => {
      const writeText = jest.fn();
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const { baseElement } = renderDataRegisters(createStore([weekdays]));
      click(byTestId(baseElement, 'goa-icon-button', 'data-register-details-weekdays'));

      click(baseElement.querySelector("goa-icon-button[title='Copy URN']"));

      expect(writeText).toHaveBeenCalledWith(urnFor('weekdays'));
    });
  });

  it('closes the editor without saving when the edit is cancelled', () => {
    const store = createStore([weekdays]);
    const { baseElement } = renderDataRegisters(store);
    click(byTestId(baseElement, 'goa-icon-button', 'data-register-edit-weekdays'));

    click(byTestId(baseElement, 'goa-button', 'data-register-cancel-weekdays'));

    expect(byTestId(baseElement, 'goa-button', 'data-register-save-weekdays')).toBeNull();
  });

  it('passes the loaded register names to the add modal for the duplicate check', () => {
    const { getByTestId } = renderDataRegisters(createStore([weekdays, colours]));

    expect(getByTestId('add-modal-mock')).toHaveAttribute('data-existing-names', 'weekdays,colours');
  });

  it('creates a register without entries when the add modal has no data', () => {
    const store = createStore([]);
    const { getByTestId } = renderDataRegisters(store);

    fireEvent.click(getByTestId('add-modal-save-without-data'));

    expect(store.getActions()).toContainEqual(createDataRegisterAction('provinces', 'Provinces', undefined));
  });

  it('updates only the entries of an edited register', () => {
    const store = createStore([weekdays]);
    const { baseElement } = renderDataRegisters(store);

    click(byTestId(baseElement, 'goa-icon-button', 'data-register-edit-weekdays'));
    click(byTestId(baseElement, 'goa-button', 'data-register-save-weekdays'));

    expect(store.getActions()).toContainEqual(updateDataRegisterAction('weekdays', undefined, ['Monday']));
  });

  describe('saving an edited register', () => {
    const editAndSave = (store: ReturnType<typeof createStore>) => {
      const result = renderDataRegisters(store);
      click(byTestId(result.baseElement, 'goa-icon-button', 'data-register-edit-weekdays'));
      click(byTestId(result.baseElement, 'goa-button', 'data-register-save-weekdays'));
      return result;
    };

    const rerenderWith = (rerender: (ui: React.ReactElement) => void, store: ReturnType<typeof createStore>) =>
      rerender(
        <Provider store={store}>
          <DataRegisters />
        </Provider>,
      );

    const saveButton = (baseElement: HTMLElement) => byTestId(baseElement, 'goa-button', 'data-register-save-weekdays');

    it('keeps the editor open with Save disabled until the update finishes', () => {
      const { baseElement } = editAndSave(createStore([weekdays]));

      expect(saveButton(baseElement)).toHaveAttribute('disabled', 'true');
    });

    it('closes the editor once the update completes', () => {
      const { baseElement, rerender } = editAndSave(createStore([weekdays]));

      rerenderWith(rerender, createStore([weekdays], false, [updateState('completed')]));

      expect(saveButton(baseElement)).toBeNull();
    });

    it('keeps the editor open and re-enables Save when the update fails', () => {
      const { baseElement, rerender } = editAndSave(createStore([weekdays]));

      rerenderWith(rerender, createStore([weekdays], false, [updateState('error')]));

      expect(saveButton(baseElement)).not.toHaveAttribute('disabled');
    });

    it('does not mistake a completed earlier save for this one', () => {
      const { baseElement } = editAndSave(createStore([weekdays], false, [updateState('completed')]));

      expect(saveButton(baseElement)).not.toBeNull();
    });

    it('keeps the editor open while the registers are refetched after a failed update', () => {
      const { baseElement, rerender } = editAndSave(createStore([weekdays]));

      rerenderWith(rerender, createStore([weekdays], true, [updateState('error')]));

      expect(saveButton(baseElement)).not.toBeNull();
    });
  });

  it('warns that forms using the register lose its options before deleting', () => {
    const { baseElement, getByText } = renderDataRegisters(createStore([weekdays]));

    click(byTestId(baseElement, 'goa-icon-button', 'data-register-delete-weekdays'));

    expect(getByText(/Forms that reference this register will lose its/)).toBeInTheDocument();
  });

  it('deletes the register when the delete is confirmed', () => {
    const store = createStore([weekdays]);
    const { baseElement } = renderDataRegisters(store);

    click(byTestId(baseElement, 'goa-icon-button', 'data-register-delete-weekdays'));
    click(byTestId(baseElement, 'goa-button', 'delete-confirm'));

    expect(store.getActions()).toContainEqual(deleteDataRegisterAction('weekdays', urnFor('weekdays')));
  });
});

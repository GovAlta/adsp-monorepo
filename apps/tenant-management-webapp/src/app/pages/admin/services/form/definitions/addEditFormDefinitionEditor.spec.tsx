import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddEditFormDefinitionEditor, onSaveDispositionForModal } from './addEditFormDefinitionEditor';
import { Disposition, FormDefinition } from '@store/form/model';
import { add } from 'lodash';

describe('Test AddEditFormDefinitionEditor', () => {
  const dispositionsToTest: Disposition[] = [
    {
      id: 'pending',
      name: 'pending',
      description: 'pending state',
    },
    {
      id: 'rejected',
      name: 'rejected',
      description: 'rejected state',
    },
  ];

  const definition: FormDefinition = {
    id: 'test-form',
    name: 'test-form',
    description: 'test form for unit testing',
    dataSchema: null,
    applicantRoles: [],
    clerkRoles: [],
    assessorRoles: [],
    formDraftUrlTemplate: 'http://test.com',
    anonymousApply: false,
    uiSchema: null,
    dispositionStates: dispositionsToTest,
    submissionRecords: true,
    queueTaskToProcess: { queueName: 'test-queue', queueNameSpace: 'queue-namespace' },
  };

  it('can save new disposition state', () => {
    const addDispositionState: Disposition = {
      id: 'missing-data',
      name: 'missing data',
      description: 'missing data state',
    };

    const [updatedDefinition, index] = onSaveDispositionForModal(true, addDispositionState, definition, null);
    expect(updatedDefinition && updatedDefinition.dispositionStates).toBeDefined();
    expect(index).toBeNull();
  });

  it('cannot save new disposition state with undefined disposition states', () => {
    const addDispositionState: Disposition = {
      id: 'missing-data',
      name: 'missing data',
      description: 'missing data state',
    };

    const initialLength = definition.dispositionStates.length;
    const [updatedDefinition, index] = onSaveDispositionForModal(true, undefined, definition, null);
    const updatedLength = updatedDefinition.dispositionStates.length;

    expect(updatedDefinition && initialLength === updatedLength).toBeTruthy();
    expect(index).toBeNull();
  });

  it('can update disposition state', () => {
    const updateDispositionState: Disposition = {
      id: 'pending',
      name: 'new pending',
      description: 'new pending data state',
    };
    const currentIndex = definition.dispositionStates.findIndex((y) => (y.id = updateDispositionState.id));
    const [updatedDefinition, index] = onSaveDispositionForModal(
      false,
      updateDispositionState,
      definition,
      currentIndex
    );
    expect(updatedDefinition).toBeDefined();
    expect(index).toBeNull();
  });

  it('cannot update disposition state when undefined', () => {
    const updateDispositionState: Disposition = {
      id: 'pending',
      name: 'new pending',
      description: 'new pending data state',
    };
    const initialLength = definition.dispositionStates.length;

    const currentIndex = definition.dispositionStates.findIndex((y) => (y.id = updateDispositionState.id));
    const [updatedDefinition, index] = onSaveDispositionForModal(
      false,
      updateDispositionState,
      definition,
      currentIndex
    );
    const updatedLength = updatedDefinition.dispositionStates.length;

    expect(updatedDefinition && initialLength === updatedLength).toBeTruthy();
    expect(index).toBeNull();
  });
});

import React from 'react';
import '@testing-library/jest-dom';
import { onSaveDispositionForModal } from './addEditFormDefinitionEditor';
import { Disposition, FormDefinition } from '@store/form/model';

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
    expect(updatedDefinition && updatedDefinition.dispositionStates.length > dispositionsToTest.length).toBe(true);
    expect(index).toBeNull();
  });

  it('cannot save new disposition state with undefined disposition states', () => {
    const initialLength = dispositionsToTest.length;
    const cloneDefinition = { ...definition };
    cloneDefinition.dispositionStates = [...dispositionsToTest];

    const [updatedDefinition, index] = onSaveDispositionForModal(true, undefined, cloneDefinition, null);
    const updatedLength = updatedDefinition.dispositionStates.length;

    expect(updatedDefinition && initialLength === updatedLength).toBe(true);
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
    const foundIndex = updatedDefinition.dispositionStates.findIndex((y) => y.name === 'new pending');
    expect(updatedDefinition && foundIndex >= 0).toBe(true);
    expect(index).toBeNull();
  });

  it('cannot find and update disposition state', () => {
    const updateDispositionState1: Disposition = {
      id: 'invalid pending',
      name: 'invalid new pending',
      description: 'invalid new pending data state',
    };

    const currentIndex = definition.dispositionStates.findIndex((y) => y.name === 'pending-test');
    const [updatedDefinition, index] = onSaveDispositionForModal(
      false,
      updateDispositionState1,
      definition,
      currentIndex
    );
    const updatedIndex = updatedDefinition.dispositionStates.findIndex((y) => y.name === updateDispositionState1.name);

    expect(updatedDefinition && updatedIndex < 0).toBe(true);
    expect(index).toBeNull();
  });
});

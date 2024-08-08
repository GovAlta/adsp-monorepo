import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ValueDefinitionsList } from './definitionsList';
import type { ValueDefinition } from '@store/value/models';
import configureStore from 'redux-mock-store';
import { ValueComponent } from './definitionsList';
import { DELETE_VALUE_DEFINITION_ACTION } from '@store/value/actions';
import { Provider } from 'react-redux';

describe('ValueComponent', () => {
  const mockCoreDefinition = {
    namespace: 'example',
    name: 'Example Name',
    description: 'Example Description',
    jsonSchema: { type: 'string' },
    isCore: true,
  };
  const mockDelete = jest.fn();
  const mockDefinition = {
    namespace: 'example',
    name: 'Example Name',
    description: 'Example Description',
    jsonSchema: { type: 'string' },
    isCore: false,
  };

  it('renders correctly with given props', () => {
    render(<ValueComponent definition={mockCoreDefinition} onDelete={mockDelete} />);
    expect(screen.getByTestId('name')).toHaveTextContent('Example Name');
    expect(screen.getByTestId('description')).toHaveTextContent('Example Description');
    expect(screen.getByTestId('actions')).toBeInTheDocument();
  });

  it('toggles details visibility', async () => {
    render(<ValueComponent definition={mockCoreDefinition} onDelete={mockDelete} />);
    const toggleButton = screen.getByTestId('toggle-details-visibility');
    fireEvent(toggleButton, new CustomEvent('_click'));
    await waitFor(() => {
      expect(screen.getByTestId('value-schema-details').textContent.trim()).toBe(
        JSON.stringify(mockCoreDefinition.jsonSchema, null, 2).trim()
      );
    });
    fireEvent(toggleButton, new CustomEvent('_click'));
    await waitFor(() => {
      expect(screen.queryByTestId('value-schema-details')).not.toBeInTheDocument();
    });
  });

  it('deletes action item to be exist', async () => {
    render(<ValueComponent definition={mockDefinition} onDelete={mockDelete} />);
    const deleteBtn = screen.getAllByTestId('delete-details')[0];
    expect(deleteBtn).toBeInTheDocument();
  });
});

describe('ValueDefinitionsList', () => {
  const mockDefinitions: ValueDefinition[] = [
    {
      namespace: 'example',
      name: 'Example Name',
      description: 'Example Description',
      jsonSchema: { type: 'string' },
      isCore: true,
    },
    {
      namespace: 'example',
      name: 'Another Name',
      description: 'Another Description',
      jsonSchema: { type: 'number' },
      isCore: false,
    },
    {
      namespace: 'test',
      name: 'Test Name',
      description: 'Test Description',
      jsonSchema: { type: 'boolean' },
      isCore: true,
    },
  ];
  const mockDelete = jest.fn();

  it('renders correctly with given props', () => {
    render(<ValueDefinitionsList definitions={mockDefinitions} onDelete={mockDelete} />);
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('Example Name')).toBeInTheDocument();
    expect(screen.getByText('Another Name')).toBeInTheDocument();
    expect(screen.getByText('Test Name')).toBeInTheDocument();
  });

  it('renders "no item" message when there are no definitions', () => {
    render(<ValueDefinitionsList definitions={[]} onDelete={mockDelete} />);
    expect(screen.getByText('No value definition found')).toBeInTheDocument();
  });

  it('groups and sorts definitions correctly', () => {
    render(<ValueDefinitionsList definitions={mockDefinitions} onDelete={mockDelete} />);
    const groupNames = screen.getAllByTestId('name');
    expect(groupNames[0]).toHaveTextContent('Another Name');
  });
});

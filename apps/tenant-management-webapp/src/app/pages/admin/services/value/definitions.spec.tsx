import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ValueDefinitionsList } from './definitionsList';
import type { ValueDefinition } from '@store/value/models';
import { ValueComponent } from './definitionsList';

describe('ValueComponent', () => {
  const mockDefinition = {
    namespace: 'example',
    name: 'Example Name',
    description: 'Example Description',
    jsonSchema: { type: 'string' },
    isCore: true,
  };

  it('renders correctly with given props', () => {
    render(<ValueComponent definition={mockDefinition} />);
    expect(screen.getByTestId('name')).toHaveTextContent('Example Name');
    expect(screen.getByTestId('description')).toHaveTextContent('Example Description');
    expect(screen.getByTestId('actions')).toBeInTheDocument();
  });

  it('toggles details visibility', async () => {
    render(<ValueComponent definition={mockDefinition} />);
    const toggleButton = screen.getByTestId('toggle-details-visibility');
    fireEvent(toggleButton, new CustomEvent('_click'));
    await waitFor(() => {
      expect(screen.getByTestId('details').textContent.trim()).toBe(
        JSON.stringify(mockDefinition.jsonSchema, null, 2).trim()
      );
    });
    fireEvent(toggleButton, new CustomEvent('_click'));
    await waitFor(() => {
      expect(screen.queryByTestId('details')).not.toBeInTheDocument();
    });
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

  it('renders correctly with given props', () => {
    render(<ValueDefinitionsList definitions={mockDefinitions} className="custom-class" />);
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('Example Name')).toBeInTheDocument();
    expect(screen.getByText('Another Name')).toBeInTheDocument();
    expect(screen.getByText('Test Name')).toBeInTheDocument();
  });

  it('renders "no item" message when there are no definitions', () => {
    render(<ValueDefinitionsList definitions={[]} className="custom-class" />);
    expect(screen.getByText('No value definition found')).toBeInTheDocument();
  });

  it('groups and sorts definitions correctly', () => {
    render(<ValueDefinitionsList definitions={mockDefinitions} className="custom-class" />);
    const groupNames = screen.getAllByTestId('name');
    expect(groupNames[0]).toHaveTextContent('Another Name');
  });
});

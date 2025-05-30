import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ValueDefinitionsList } from './definitionsList';
import type { ValueDefinition } from '@store/value/models';

import { ValueComponent } from './definitionsList';

describe('Value Component', () => {
  const mockCoreDefinition = {
    namespace: 'example',
    name: 'Example Name',
    description: 'Example Description',
    jsonSchema: { type: 'string' },
    isCore: true,
  };
  const mockDelete = jest.fn();
  const mockEdit = jest.fn();
  const mockDefinition = {
    namespace: 'example',
    name: 'Example Name',
    description: 'Example Description',
    jsonSchema: { type: 'string' },
    isCore: false,
  };

  it('renders correctly with given props', () => {
    render(<ValueComponent definition={mockCoreDefinition} onDelete={mockDelete} onEdit={mockEdit} />);
    expect(screen.getByTestId('name')).toHaveTextContent('Example Name');
    expect(screen.getByTestId('description')).toHaveTextContent('Example Description');
    expect(screen.getByTestId('actions')).toBeInTheDocument();
  });

  it('toggles details visibility', async () => {
    const { baseElement } = render(
      <ValueComponent definition={mockCoreDefinition} onDelete={mockDelete} onEdit={mockEdit} />
    );
    const toggleButton = baseElement.querySelector("goa-icon-button[testId='toggle-details-visibility']");
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
    const { baseElement } = render(
      <ValueComponent definition={mockDefinition} onDelete={mockDelete} onEdit={mockEdit} />
    );
    const deleteBtn = baseElement.querySelectorAll("goa-icon-button[testId='delete-details']")[0];
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
  const mockEdit = jest.fn();

  it('renders correctly with given props', () => {
    render(<ValueDefinitionsList definitions={mockDefinitions} onDelete={mockDelete} onEdit={mockEdit} />);
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('Example Name')).toBeInTheDocument();
    expect(screen.getByText('Another Name')).toBeInTheDocument();
    expect(screen.getByText('Test Name')).toBeInTheDocument();
  });

  it('groups and sorts definitions correctly', () => {
    render(<ValueDefinitionsList definitions={mockDefinitions} onDelete={mockDelete} onEdit={mockEdit} />);
    const groupNames = screen.getAllByTestId('name');
    expect(groupNames[0]).toHaveTextContent('Another Name');
  });
});

describe('Value Component', () => {
  const mockCoreDefinition = {
    namespace: 'example',
    name: 'Example Name',
    description: 'Example Description',
    jsonSchema: { type: 'string' },
    isCore: true,
  };
  const mockDelete = jest.fn();
  const mockEdit = jest.fn();

  const mockDefinition = {
    namespace: 'example',
    name: 'Example Name',
    description: 'Example Description',
    jsonSchema: { type: 'string' },
    isCore: false,
  };

  it('renders correctly with given props', () => {
    render(<ValueComponent definition={mockCoreDefinition} onDelete={mockDelete} onEdit={mockEdit} />);
    expect(screen.getByTestId('name')).toHaveTextContent('Example Name');
    expect(screen.getByTestId('description')).toHaveTextContent('Example Description');
    expect(screen.getByTestId('actions')).toBeInTheDocument();
  });

  it('toggles details visibility', async () => {
    const { baseElement } = render(
      <ValueComponent definition={mockCoreDefinition} onDelete={mockDelete} onEdit={mockEdit} />
    );
    const toggleButton = baseElement.querySelector("goa-icon-button[testId='toggle-details-visibility']");
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
    const { baseElement } = render(
      <ValueComponent definition={mockDefinition} onDelete={mockDelete} onEdit={mockEdit} />
    );
    const deleteBtn = baseElement.querySelectorAll("goa-icon-button[testId='delete-details']")[0];
    expect(deleteBtn).toBeInTheDocument();
  });

  it('does not call onEdit when the definition is a core definition', () => {
    const { baseElement } = render(
      <ValueComponent definition={mockCoreDefinition} onEdit={mockEdit} onDelete={mockDelete} />
    );
    const editBtn = baseElement.querySelector("goa-icon-button[testId='edit-details']");
    expect(editBtn).not.toBeInTheDocument();
  });

  it('does not render edit button for core definitions', () => {
    render(<ValueComponent definition={mockCoreDefinition} onDelete={mockDelete} onEdit={mockEdit} />);
    expect(screen.queryByTestId('edit-details')).not.toBeInTheDocument();
  });

  it('renders edit button for non-core definitions', () => {
    const { baseElement } = render(
      <ValueComponent definition={mockDefinition} onDelete={mockDelete} onEdit={mockEdit} />
    );
    expect(baseElement.querySelector("goa-icon-button[testId='edit-details']")).toBeInTheDocument();
  });

  it('does not trigger delete action when edit button is clicked', () => {
    const { baseElement } = render(
      <ValueComponent definition={mockDefinition} onEdit={mockEdit} onDelete={mockDelete} />
    );
    const editBtn = baseElement.querySelector("goa-icon-button[testId='edit-details']");
    fireEvent.click(editBtn);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

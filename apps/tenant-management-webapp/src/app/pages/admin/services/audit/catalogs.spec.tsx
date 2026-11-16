import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { AuditCatalogs } from './catalogs';

const catalogs = [
  {
    application: 'form-service',
    isCore: true,
    actions: [
      { name: 'submit', category: 'data', severity: 'info', description: 'Form submitted', version: '1' },
      { name: 'delete', category: 'security', severity: 'critical', metadataSchema: { type: 'object' } },
    ],
  },
  {
    application: 'file-service',
    isCore: false,
    actions: [{ name: 'upload', category: 'data', severity: 'warning' }],
  },
];

const renderCatalogs = () => {
  const store = createStore(() => ({ session: { indicator: { show: false } }, audit: { catalogs } }));
  return render(
    <Provider store={store}>
      <AuditCatalogs />
    </Provider>,
  );
};

const search = (baseElement: HTMLElement, value: string) =>
  fireEvent(
    baseElement.querySelector("goa-input[name='audit-catalog-search']") as Element,
    new CustomEvent('_change', { detail: { name: 'audit-catalog-search', value } }),
  );

const click = (baseElement: HTMLElement, selector: string) =>
  fireEvent(baseElement.querySelector(selector) as Element, new CustomEvent('_click'));

describe('AuditCatalogs', () => {
  it('starts collapsed and expands a card on toggle', () => {
    const { getByTestId, queryByTestId } = renderCatalogs();
    expect(queryByTestId('audit-catalog-form-service')).toBeNull();
    expect(getByTestId('audit-catalog-toggle-form-service')).toHaveTextContent('form-service (core) · 2');

    fireEvent.click(getByTestId('audit-catalog-toggle-form-service'));
    expect(queryByTestId('audit-catalog-form-service')).toBeInTheDocument();
    expect(queryByTestId('audit-catalog-file-service')).toBeNull();
  });

  it('expands and collapses all cards', () => {
    const { baseElement, queryByTestId } = renderCatalogs();

    click(baseElement, "goa-button[testId='audit-catalog-expand-all']");
    expect(queryByTestId('audit-catalog-form-service')).toBeInTheDocument();
    expect(queryByTestId('audit-catalog-file-service')).toBeInTheDocument();

    click(baseElement, "goa-button[testId='audit-catalog-collapse-all']");
    expect(queryByTestId('audit-catalog-form-service')).toBeNull();
    expect(queryByTestId('audit-catalog-file-service')).toBeNull();
  });

  it('searches across applications, expanding matches and hiding empty cards', () => {
    const { baseElement, queryByTestId, getByTestId, getAllByTestId } = renderCatalogs();

    search(baseElement, 'UPLOAD');

    expect(getAllByTestId('audit-action-name')).toHaveLength(1);
    expect(getByTestId('audit-catalog-count')).toHaveTextContent('1 of 3 actions');
    expect(queryByTestId('audit-catalog-toggle-form-service')).toBeNull();

    search(baseElement, 'zzz');
    expect(getByTestId('audit-catalog-no-match')).toBeInTheDocument();
  });

  it('clears the search from the input icon, which only shows when there is text', () => {
    const { baseElement, queryByTestId } = renderCatalogs();
    const input = () => baseElement.querySelector("goa-input[name='audit-catalog-search']") as Element;
    expect(input().getAttribute('trailingicon')).toBeNull();

    search(baseElement, 'upload');
    expect(input().getAttribute('trailingicon')).toBe('close');
    expect(queryByTestId('audit-catalog-count')).toBeInTheDocument();

    fireEvent(input(), new CustomEvent('_trailingIconClick'));
    expect(queryByTestId('audit-catalog-count')).toBeNull();
    expect(input().getAttribute('trailingicon')).toBeNull();
  });

  it('highlights where the search matched, showing the description only when it matched there', () => {
    const { baseElement, getByTestId, queryByTestId } = renderCatalogs();

    search(baseElement, 'sub');
    expect(getByTestId('audit-action-name').querySelector('mark')).toHaveTextContent('sub');
    expect(queryByTestId('audit-action-description-match')).toBeInTheDocument();
    expect(getByTestId('audit-action-description-match').querySelector('mark')).toHaveTextContent('sub');

    search(baseElement, 'secur');
    expect(baseElement.querySelector('td mark')).toHaveTextContent('secur');
    expect(queryByTestId('audit-action-description-match')).toBeNull();
  });

  it('toggles details from the row with mouse and keyboard, showing the JSON structure', () => {
    const { getByTestId, getAllByTestId, queryByTestId } = renderCatalogs();
    fireEvent.click(getByTestId('audit-catalog-toggle-form-service'));
    const row = getAllByTestId('audit-action-row')[1];
    expect(row).toHaveAttribute('role', 'button');
    expect(row).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(row, { key: 'Enter' });
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(queryByTestId('audit-action-details')).toHaveTextContent('"metadataSchema": { "type": "object" }');

    fireEvent.keyDown(row, { key: ' ' });
    expect(queryByTestId('audit-action-details')).toBeNull();

    fireEvent.click(row);
    expect(queryByTestId('audit-action-details')).toBeInTheDocument();
  });
});

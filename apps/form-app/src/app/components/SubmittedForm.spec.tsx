import React from 'react';

import { readOnlyUiSchema } from './SubmittedForm';
import { Layout } from '@jsonforms/core';

const uiSchema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Personal Information',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/firstName' },
            { type: 'Control', scope: '#/properties/secondName' },
            { type: 'Control', scope: '#/properties/FileUploader', options: { variant: 'button' } },
            { type: 'Control', scope: '#/properties/FileUploader2', options: { variant: 'dragdrop' } },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/birthDate' },
            { type: 'Control', scope: '#/properties/nationality' },
            {
              type: 'Control',
              scope: '#/properties/carBrands',
              options: {
                enumContext: {
                  key: 'car-brands',
                  url: 'https://parallelum.com.br/fipe/api/v1/carros/marcas',
                  values: 'nome',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/dogBreeds',
              options: {
                enumContext: {
                  key: 'dog-list',
                  url: 'https://dog.ceo/api/breeds/list/all',
                  location: 'message',
                  type: 'keys',
                },
              },
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/basketballPlayers',
              options: {
                autocomplete: true,
                enumContext: {
                  key: 'basketball-players',
                  location: 'data',
                  url: 'https://www.balldontlie.io/api/v1/players',
                  values: ['first_name', 'last_name'],
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/countries',
              options: { autocomplete: true, enumContext: { key: 'countries' } },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      i18n: 'address',
      label: 'Address Information',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/address/properties/street' },
            { type: 'Control', scope: '#/properties/address/properties/streetNumber' },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/address/properties/city' },
            { type: 'Control', scope: '#/properties/address/properties/postalCode' },
          ],
        },
      ],
    },
    {
      type: 'Category',
      label: 'Additional Information',
      elements: [
        { type: 'Control', scope: '#/properties/vegetarianOptions/properties/vegan' },
        { type: 'Control', scope: '#/properties/vegetarianOptions/properties/favoriteVegetable' },
      ],
    },
  ],
  options: { variant: 'stepper', showNavButtons: true },
};

describe('add readonly', () => {
  it('it adds readonly to everything so that every input is readonly', () => {
    const response = readOnlyUiSchema(uiSchema) as Layout;
    const testReadOnly = (elements) => {
      Array.isArray(elements) &&
        elements.forEach((element) => {
          expect(element.options.componentProps.readOnly).toBe(true);
          testReadOnly(element.elements);
        });
    };
    response.elements.forEach((element: Layout) => {
      expect(element.options.componentProps.readOnly).toBe(true);
      testReadOnly(element.elements);
    });
  });
});

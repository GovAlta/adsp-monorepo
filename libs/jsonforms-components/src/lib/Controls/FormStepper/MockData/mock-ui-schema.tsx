export const MockUiSchema = {
  type: 'Group',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/testCategorization',
    },
    {
      type: 'Categorization',
      rule: {
        effect: 'HIDE',
        condition: {
          scope: '#/properties/testCategorization',
          schema: {
            const: true,
          },
        },
      },
      elements: [
        {
          type: 'Category',
          label: 'Personal Information',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/testVerticalLayout',
            },
            {
              type: 'Control',
              scope: '#/properties/testHorizontalLayout',
            },
            {
              type: 'Control',
              scope: '#/properties/testCategoryAddress',
            },
            {
              type: 'Control',
              scope: '#/properties/testHelpContent',
            },
            {
              type: 'Control',
              scope: '#/properties/testGroup',
            },
            {
              type: 'Control',
              scope: '#/properties/testControl',
            },
            {
              type: 'Control',
              scope: '#/properties/testListWithDetail',
            },
            {
              type: 'HelpContent',
              label: 'Provide your information',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testHelpContent',
                  schema: {
                    const: true,
                  },
                },
              },
              options: {
                help: 'Some personal information is objective. A customer might provide your company with their name, address, or IP address.',
              },
            },
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  rule: {
                    effect: 'HIDE',
                    condition: {
                      scope: '#/properties/testControl',
                      schema: {
                        const: true,
                      },
                    },
                  },
                  scope: '#/properties/firstName',
                },
                {
                  type: 'Control',
                  scope: '#/properties/secondName',
                },
                {
                  type: 'Group',
                  elements: [
                    {
                      type: 'Control',
                      scope: '#/properties/vegetarian',
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/secondName',
                    },
                  ],
                  rule: {
                    effect: 'HIDE',
                    condition: {
                      scope: '#/properties/testGroup',
                      schema: {
                        const: true,
                      },
                    },
                  },
                },
                {
                  type: 'Control',
                  scope: '#/properties/FileUploader',
                },
                {
                  type: 'Control',
                  scope: '#/properties/FileUploader2',
                },
              ],
            },
            {
              type: 'HorizontalLayout',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testHorizontalLayout',
                  schema: {
                    const: true,
                  },
                },
              },
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/birthDate',
                },
                {
                  type: 'Control',
                  scope: '#/properties/nationality',
                },
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
              type: 'VerticalLayout',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testVerticalLayout',
                  schema: {
                    const: true,
                  },
                },
              },
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
                  options: {
                    autocomplete: true,
                    enumContext: {
                      key: 'countries',
                    },
                  },
                },
              ],
            },
            {
              type: 'ListWithDetail',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testListWithDetail',
                  schema: {
                    const: true,
                  },
                },
              },
              scope: '#/properties/dependant',
              options: {
                addButtonPosition: 'right',
                addButtonText: 'Add child',
              },
              elements: [
                {
                  type: 'HorizontalLayout',
                  elements: [
                    {
                      type: 'Control',
                      scope: '#/properties/first-name',
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/last-name',
                    },
                  ],
                },
                {
                  type: 'VerticalLayout',
                  elements: [
                    {
                      type: 'Control',
                      scope: '#/properties/dob',
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/address',
                    },
                  ],
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
                {
                  type: 'Control',
                  scope: '#/properties/address/properties/street',
                },
                {
                  type: 'Control',
                  scope: '#/properties/address/properties/streetNumber',
                },
              ],
            },
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/address/properties/city',
                },
                {
                  type: 'Control',
                  scope: '#/properties/address/properties/postalCode',
                },
              ],
            },
          ],
          rule: {
            effect: 'HIDE',
            condition: {
              scope: '#/properties/testCategoryAddress',
              schema: {
                const: true,
              },
            },
          },
        },
        {
          type: 'Category',
          label: 'Additional Information',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/testControl',
            },
            {
              type: 'Control',
              scope: '#/properties/vegetarianOptions/properties/favoriteVegetable',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testControl',
                  schema: {
                    const: true,
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/firstName',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testControl',
                  schema: {
                    const: true,
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/vegetarianOptions/properties/favoriteVegetable',
              options: {
                format: 'radio',
              },
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testControl',
                  schema: {
                    const: true,
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/multiLine',
              options: {
                multi: true,
              },
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testControl',
                  schema: {
                    const: true,
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/provideAddress',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testControl',
                  schema: {
                    const: true,
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/birthDate',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testControl',
                  schema: {
                    const: true,
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/integer',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testControl',
                  schema: {
                    const: true,
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/number',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testControl',
                  schema: {
                    const: true,
                  },
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/multiples',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/testControl',
                  schema: {
                    const: true,
                  },
                },
              },
            },
          ],
        },
      ],
      options: {
        variant: 'stepper',
        showNavButtons: true,
      },
    },
  ],
};

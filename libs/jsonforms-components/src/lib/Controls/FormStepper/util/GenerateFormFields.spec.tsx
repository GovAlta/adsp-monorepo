import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getFormFieldValue, RenderFormFields, resolveLabelFromScope } from './GenerateFormFields';
const MockElement = [
  {
    type: 'Control',
    scope: '#/properties/firstName',
  },
];
const MockData = {
  firstName: 'John',
  testCategoryAddress: true,
  fileUploader: 'urn:ads:platform:file-service:v1:/files/791a90e4-6382-46c1-b0cf-a2c370e424f0',
};

const MockUISchema = [
  {
    type: 'Category',
    label: 'Personal Information',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/testCategoryAddress',
      },
      {
        type: 'Control',
        scope: '#/properties/firstName',
      },
      {
        type: 'Control',
        scope: '#/properties/fileUploader',
        options: {
          variant: 'button',
        },
      },
    ],
  },
  {
    type: 'Category',
    i18n: 'address',
    label: 'Address Information',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/address/properties/street',
      },
      {
        type: 'Control',
        scope: '#/properties/address/properties/city',
      },
    ],
  },
];
const MockRequiredFields = ['firstName'];

//mock data
const data = {
  firstName: 'Alex',
  address: {
    street: 'Springfield',
  },
};
const data1 = {
  firstName: '',
  address: {
    street: '',
  },
};

const translator = {
  id: '',
  defaultMessage: '',
  values: '',
};

describe('resolveLabelFromScope', () => {
  it('Should correctly resolve and format label from scope', () => {
    const scope1 = '#/properties/firstName';
    const scope2 = '#/properties/address/properties/street';
    expect(resolveLabelFromScope(scope1)).toEqual('First name');
    expect(resolveLabelFromScope(scope2)).toEqual('Street');
  });
});
describe('getFormFieldValue', () => {
  it('Should return the correct value for a given scope', () => {
    const scope1 = '#/properties/firstName';
    const scope2 = '#/properties/address/properties/street';
    expect(getFormFieldValue(scope1, data)).toEqual('Alex');
    expect(getFormFieldValue(scope2, data)).toEqual('Springfield');
  });
});

describe('getFormFieldValue', () => {
  it('Should return empty value for a given scope and empty data', () => {
    const scope1 = '#/properties/secondName';
    const scope2 = '#/properties/address/properties/street';
    expect(getFormFieldValue(scope1, data1)).toEqual('');
    expect(getFormFieldValue(scope2, data1)).toEqual('');
  });
});

describe('ResolveLabelFromScope function', () => {
  it('returns correctly formatted string for valid scope patterns', () => {
    const validScope1 = '#/properties/firstName';
    const validScope2 = '#/properties/address/properties/city';
    expect(resolveLabelFromScope(validScope1)).toEqual('First name');
    expect(resolveLabelFromScope(validScope2)).toEqual('City');
  });

  it('returns null for scope not starting with "#"', () => {
    const invalidScope = '/properties/firstName';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });

  it('returns null for scope missing "properties"', () => {
    const invalidScope = '#/firstName';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });

  it('returns null for scope with incorrect "properties" spelling', () => {
    const invalidScope = '#/propertees/firstName';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });

  it('returns null for invalid scope patterns', () => {
    const invalidScope1 = '#/properties/';
    const invalidScope2 = '##/properties/firstName';
    const invalidScope3 = '#/properties/first/Name';
    expect(resolveLabelFromScope(invalidScope1)).toBeNull();
    expect(resolveLabelFromScope(invalidScope2)).toBeNull();
    expect(resolveLabelFromScope(invalidScope3)).toBeNull();
  });

  it('returns empty string for empty or null scope', () => {
    const emptyScope = '';
    expect(resolveLabelFromScope(emptyScope)).toBeNull();
  });

  it('returns an empty string if the scope does not end with a valid property name', () => {
    const invalidScope = '#/properties/';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });
});

describe('Generate Form Fields', () => {
  it('should render correctly', () => {
    const LoadComponent = () => (
      <RenderFormFields elements={MockUISchema[0].elements} data={MockData} requiredFields={MockRequiredFields} />
    );
    render(<LoadComponent />);
    expect(screen.getByText(/First name/)).toBeInTheDocument();
    expect(screen.getByText(/John/)).toBeInTheDocument();
    expect(screen.getByText(/\*:/)).toBeInTheDocument();
  });
  it('should not have asterisk', () => {
    const LoadComponent = () => (
      <RenderFormFields elements={MockUISchema[1].elements} data={MockData} requiredFields={MockRequiredFields} />
    );
    render(<LoadComponent />);
    expect(screen.getByText(/Street/)).toBeInTheDocument();
    expect(screen.getByText(/City/)).toBeInTheDocument();
  });
  it('should include file information', () => {
    const LoadComponent = () => (
      <RenderFormFields elements={MockUISchema[0].elements} data={MockData} requiredFields={MockRequiredFields} />
    );
    render(<LoadComponent />);
    expect(screen.getByText(/File uploader /)).toBeInTheDocument();
  });
});

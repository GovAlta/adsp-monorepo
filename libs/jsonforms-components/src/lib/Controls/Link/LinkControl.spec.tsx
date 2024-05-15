import React from 'react';
import { render, waitFor, getByText, queryByText } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LinkSelect, LinkSelectProps } from './LinkControl';
import { ControlElement } from '@jsonforms/core';
import { validateUrl } from '../../Context/register/util';

jest.mock('../../Context/register/util');

describe('LinkSelect component', () => {
  let linkUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/link',
    options: {
      componentProps: {},
    },
  };

  const staticProps: LinkSelectProps = {
    uischema: linkUiSchema,
    schema: {
      type: 'object',
      properties: {
        link: {},
      },
    },
    rootSchema: {},
    handleChange: jest.fn(),
    enabled: true,
    label: 'Link',
    id: 'link',
    config: {},
    path: '',
    locale: '',
    errors: '',
    data: 'Option1',
    visible: true,
    t: jest.fn(),
  };

  describe('can create LinkSelect component', () => {
    afterEach(() => {
      (validateUrl as jest.Mock).mockReset();
    });
    it('renders basic LinkSelect component', () => {
      const props = { ...staticProps };
      const component = render(<LinkSelect {...props} />);
      expect(component.getByText('Link')).toBeInTheDocument();
    });
    it('renders LinkSelect component with link name only', () => {
      linkUiSchema = {
        type: 'Control',
        scope: '#/properties/link',
        options: {
          componentProps: {
            label: 'Alberta Farm',
          },
        },
      };
      const props = { ...staticProps, uischema: linkUiSchema };
      const component = render(<LinkSelect {...props} />);
      expect(component.getByText('Alberta Farm')).toBeInTheDocument();
    });
    it('renders LinkSelect component with link and name', async () => {
      linkUiSchema = {
        type: 'Control',
        scope: '#/properties/link',
        options: {
          componentProps: {
            label: 'Alberta Farm',
            link: 'https://open.alberta.ca/dataset/70c50877-aaa9-442c-a10e-328eb53aa5f1/resource/2bfb6ff5-d246-4b76-8267-548ed58bf339/download/agi-alberta-farm-fuel-benefit-program-fuel-tax-exemption-application-2023.pdf',
          },
        },
      };

      const props = { ...staticProps, uischema: linkUiSchema };

      (validateUrl as jest.Mock).mockResolvedValueOnce(true);

      const { container } = render(<LinkSelect {...props} />);
      await waitFor(() => {
        const anchorElement = container.querySelector(
          'a[href="https://open.alberta.ca/dataset/70c50877-aaa9-442c-a10e-328eb53aa5f1/resource/2bfb6ff5-d246-4b76-8267-548ed58bf339/download/agi-alberta-farm-fuel-benefit-program-fuel-tax-exemption-application-2023.pdf"]'
        );
        const LinkText = getByText(container, 'Alberta Farm');

        expect(anchorElement).toBeInTheDocument();
        expect(LinkText).toBeInTheDocument();
      });
    });

    it('renders LinkSelect component with link and name and heading and description', async () => {
      const Link =
        'https://open.alberta.ca/dataset/70c50877-aaa9-442c-a10e-328eb53aa5f1/resource/2bfb6ff5-d246-4b76-8267-548ed58bf339/download/agi-alberta-farm-fuel-benefit-program-fuel-tax-exemption-application-2023.pdf';
      linkUiSchema = {
        type: 'Control',
        scope: '#/properties/link',
        options: {
          componentProps: {
            label: 'Alberta Farm',
            link: Link,
            heading: 'Fuel Benefit',
            description: 'For more information about the fuel benefit:',
          },
        },
      };

      const props = { ...staticProps, uischema: linkUiSchema };
      (validateUrl as jest.Mock).mockResolvedValueOnce(true);

      const { container } = render(<LinkSelect {...props} />);
      await waitFor(() => {
        const anchorElement = container.querySelector(`a[href="${Link}"]`);
        const LinkText = getByText(container, 'Alberta Farm');
        const Description = getByText(container, 'For more information about the fuel benefit:');
        const Title = container?.querySelector('goa-form-item')?.getAttribute('label');

        expect(anchorElement).toBeInTheDocument();
        expect(Title).toEqual('Fuel Benefit');
        expect(LinkText).toBeInTheDocument();
        expect(Description).toBeInTheDocument();
      });
    });

    it('renders invalid extension if extension ends with exe', async () => {
      const Link = 'https://open.alberta.ca/dataset/70c50877-aaa9-442c-a10e-328eb53aa5f1/resource/abc.exe';

      linkUiSchema = {
        type: 'Control',
        scope: '#/properties/link',
        options: {
          componentProps: {
            label: 'Alberta Farm',
            link: Link,
            heading: 'Fuel Benefit',
            description: 'For more information about the fuel benefit:',
          },
        },
      };

      const props = { ...staticProps, uischema: linkUiSchema };

      (validateUrl as jest.Mock).mockResolvedValueOnce(true);

      const { container } = render(<LinkSelect {...props} />);
      await waitFor(() => {
        const anchorElement = container.querySelector(`a[href="${Link}"]`);
        const LinkText = queryByText(container, 'Alberta Farm');
        const Title = container?.querySelector('goa-form-item')?.getAttribute('label');
        const ErrorLinkText = container?.querySelector('goa-form-item')?.getAttribute('error');
        const Description = getByText(container, 'For more information about the fuel benefit:');

        expect(anchorElement).not.toBeInTheDocument();
        expect(Title).toEqual('Fuel Benefit');
        expect(LinkText).not.toBeInTheDocument();
        expect(Description).toBeInTheDocument();
        expect(ErrorLinkText).toEqual('Invalid extension: exe');
      });
    });

    it('renders invalid link if we do not get a response by calling the url', async () => {
      const Link = 'https://open.alberta.ca/dataset/70c50877-aaa9-442c-a10e-328eb53aa5f1/resource/abc.pdf';

      linkUiSchema = {
        type: 'Control',
        scope: '#/properties/link',
        options: {
          componentProps: {
            label: 'Alberta Farm',
            link: Link,
            heading: 'Fuel Benefit',
            description: 'For more information about the fuel benefit:',
          },
        },
      };

      const props = { ...staticProps, uischema: linkUiSchema };

      // Fails to validate url = bad url
      (validateUrl as jest.Mock).mockResolvedValueOnce(false);

      const { container } = render(<LinkSelect {...props} />);
      await waitFor(() => {
        const anchorElement = container.querySelector(`a[href="${Link}"]`);
        const LinkText = queryByText(container, 'Alberta Farm');
        const Title = container?.querySelector('goa-form-item')?.getAttribute('label');
        const ErrorLinkText = container?.querySelector('goa-form-item')?.getAttribute('error');
        const Description = getByText(container, 'For more information about the fuel benefit:');

        expect(anchorElement).not.toBeInTheDocument();
        expect(Title).toEqual('Fuel Benefit');
        expect(LinkText).not.toBeInTheDocument();
        expect(Description).toBeInTheDocument();
        expect(ErrorLinkText).toEqual('Invalid Link');
      });
    });
  });
});

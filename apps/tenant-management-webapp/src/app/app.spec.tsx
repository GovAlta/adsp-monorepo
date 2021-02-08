import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';

import { BrowserRouter } from 'react-router-dom';

import App from './app';
import { act } from 'react-test-renderer';
import { stubConfig } from './utils/useConfig';

describe('App', () => {
  beforeEach(() => {
    stubConfig();
  });

  it('should render successfully', async () => {
    act(() => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText('A platform built for government services')
      ).toBeTruthy();
    });
  });
});

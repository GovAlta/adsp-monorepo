import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getCategoryStatus, getCategoryStatusBadge, PageStatus } from './CategoryStatus';
import { CategoryState } from './context';

describe('CategoryStatus', () => {
  describe('getCategoryStatus', () => {
    it('should return Complete when category is visited, completed and valid', () => {
      const category: CategoryState = {
        isVisited: true,
        isCompleted: true,
        isValid: true,
      } as CategoryState;

      const status = getCategoryStatus(category);
      expect(status).toBe(PageStatus.Complete);
    });

    it('should return In progress when category is visited but not completed', () => {
      const category: CategoryState = {
        isVisited: true,
        isCompleted: false,
        isValid: false,
      } as CategoryState;

      const status = getCategoryStatus(category);
      expect(status).toBe(PageStatus.Inprogress);
    });

    it('should return In progress when category is visited and completed but not valid', () => {
      const category: CategoryState = {
        isVisited: true,
        isCompleted: true,
        isValid: false,
      } as CategoryState;

      const status = getCategoryStatus(category);
      expect(status).toBe(PageStatus.Inprogress);
    });

    it('should return Not started when category is not visited', () => {
      const category: CategoryState = {
        isVisited: false,
        isCompleted: false,
        isValid: false,
      } as CategoryState;

      const status = getCategoryStatus(category);
      expect(status).toBe(PageStatus.NotStarted);
    });
  });

  describe('getCategoryStatusBadge', () => {
    it('should render success badge for completed category', () => {
      const category: CategoryState = {
        isVisited: true,
        isCompleted: true,
        isValid: true,
      } as CategoryState;

      const { container } = render(getCategoryStatusBadge(category));
      expect(container).toBeTruthy();
    });

    it('should render information badge for incomplete category', () => {
      const category: CategoryState = {
        isVisited: true,
        isCompleted: false,
        isValid: false,
      } as CategoryState;

      const { container } = render(getCategoryStatusBadge(category));
      expect(container).toBeTruthy();
    });

    it('should render information badge for not started category', () => {
      const category: CategoryState = {
        isVisited: false,
        isCompleted: false,
        isValid: false,
      } as CategoryState;

      const { container } = render(getCategoryStatusBadge(category));
      expect(container).toBeTruthy();
    });
  });
});

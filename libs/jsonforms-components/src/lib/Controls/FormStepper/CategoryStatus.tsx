import { GoABadge } from '@abgov/react-components';
import { CategoryState } from './context';

export enum PageStatus {
  Complete = 'Completed',
  Inprogress = 'In progress',
  NotStarted = 'Not started',
}

export const getCategoryStatus = (category: CategoryState): string => {
  return category.isVisited
    ? category.isCompleted && category.isValid
      ? PageStatus.Complete
      : PageStatus.Inprogress
    : PageStatus.NotStarted;
};

export const getCategoryStatusBadge = (category: CategoryState): JSX.Element => {
  const status = getCategoryStatus(category);
  const badgeType = status === PageStatus.Complete ? 'success' : 'information';
  return <GoABadge type={badgeType} content={status} ariaLabel={status}></GoABadge>;
};

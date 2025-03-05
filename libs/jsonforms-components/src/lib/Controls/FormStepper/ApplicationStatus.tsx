import { GoACallout } from '@abgov/react-components';
import { CategoriesState } from './context';
import { CompletionStatus } from './styled-components';
import { getCategoryStatus, PageStatus } from './CategoryStatus';

export interface ApplicationStatusProps {
  categories: CategoriesState;
}

export const ApplicationStatus = ({ categories }: ApplicationStatusProps): JSX.Element => {
  const total = categories.length;
  const completed = categories.reduce((acc, cat) => acc + (getCategoryStatus(cat) === PageStatus.Complete ? 1 : 0), 0);
  const type = total === completed ? 'success' : 'important';
  const heading = total === completed ? 'Application complete' : 'Application incomplete';
  const message = `You have completed ${completed} of ${total} sections.`;
  return (
    <CompletionStatus>
      <GoACallout type={type} heading={heading} size="medium" maxWidth={'50%'}>
        {message}
      </GoACallout>
    </CompletionStatus>
  );
};

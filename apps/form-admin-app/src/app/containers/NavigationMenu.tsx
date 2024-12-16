import { GoASideMenu, GoASideMenuHeading } from '@abgov/react-components-new';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { definitionSelector } from '../state';

export const NavigationMenu = () => {
  const navigate = useNavigate();

  const { tenant } = useParams();
  const definition = useSelector(definitionSelector);

  return (
    <GoASideMenu>
      <GoASideMenuHeading icon="documents">Form definitions</GoASideMenuHeading>
      <a
        href={`/${tenant}/definitions`}
        onClick={(e) => {
          navigate('definitions');
          e.preventDefault();
        }}
      >
        Definitions
      </a>
      {definition && (
        <>
          <GoASideMenuHeading icon="document">{definition.name}</GoASideMenuHeading>
          <a
            href={`/${tenant}/definitions/${definition.id}/overview`}
            onClick={(e) => {
              navigate(`definitions/${definition.id}/overview`);
              e.preventDefault();
            }}
          >
            Overview
          </a>
          <a
            href={`/${tenant}/definitions/${definition.id}/forms`}
            onClick={(e) => {
              navigate(`definitions/${definition.id}/forms`);
              e.preventDefault();
            }}
          >
            Forms
          </a>
          {definition.submissionRecords && (
            <a
              href={`/${tenant}/definitions/${definition.id}/submissions`}
              onClick={(e) => {
                navigate(`definitions/${definition.id}/submissions`);
                e.preventDefault();
              }}
            >
              Submissions
            </a>
          )}
        </>
      )}
    </GoASideMenu>
  );
};

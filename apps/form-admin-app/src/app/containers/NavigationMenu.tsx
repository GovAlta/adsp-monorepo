import { GoASideMenu, GoASideMenuHeading } from '@abgov/react-components-new';
import { useSelector } from 'react-redux';
import { definitionSelector } from '../state';
import { useNavigate } from 'react-router-dom';

export const NavigationMenu = () => {
  const navigate = useNavigate();
  const definition = useSelector(definitionSelector);

  return (
    <GoASideMenu>
      <GoASideMenuHeading icon="documents">Form definitions</GoASideMenuHeading>
      <a
        href={'definitions'}
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
            href={`definitions/${definition.id}/overview`}
            onClick={(e) => {
              navigate(`definitions/${definition.id}/overview`);
              e.preventDefault();
            }}
          >
            Overview
          </a>
          <a
            href={`definitions/${definition.id}/forms`}
            onClick={(e) => {
              navigate(`definitions/${definition.id}/forms`);
              e.preventDefault();
            }}
          >
            Forms
          </a>
          {definition.submissionRecords && (
            <a
              href={`definitions/${definition.id}/submissions`}
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

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  getFormDefinitions,
  definitionsSelector,
  configInitializedSelector,
  userSelector,
  selectIsAuthenticated,
} from '../../../state';

const FormDefinitions = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const definitions = useSelector(definitionsSelector);
  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized } = useSelector(userSelector);
  const authenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (configInitialized && userInitialized && authenticated) {
      dispatch(getFormDefinitions({}));
    }
  }, [dispatch, configInitialized, userInitialized, authenticated]);

  return (
    <div>
      <h1>Form Definitions</h1>
      {definitions && definitions.length > 0 ? (
        <ul>
          {definitions.map((definition) => (
            <li key={definition.id}>
              <strong>{definition.name}</strong> (ID: {definition.id})<p>{definition.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No form definitions found.</p>
      )}
    </div>
  );
};

export default FormDefinitions;

import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { usePlannerApi } from './api';
import { PatternManager } from './PatternManager';

const PLANNER_CLIENT = 'urn:ads:platform:project-planner-service';
const PLANNER_ADMIN_ROLE = 'planner-admin';

export const Patterns: FunctionComponent = () => {
  const api = usePlannerApi();
  const canEdit = useSelector(
    (state: RootState) => !!state.session?.resourceAccess?.[PLANNER_CLIENT]?.roles?.includes(PLANNER_ADMIN_ROLE)
  );

  return <PatternManager api={api} canEdit={canEdit} />;
};

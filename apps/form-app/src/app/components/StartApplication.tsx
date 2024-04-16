import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import { FunctionComponent, useEffect } from 'react';
import { AppDispatch, FormDefinition, findUserForm, userSelector } from '../state';
import { useDispatch, useSelector } from 'react-redux';

interface StartApplicationProps {
  definition: FormDefinition;
  canStart: boolean;
  onStart: () => void;
}

export const StartApplication: FunctionComponent<StartApplicationProps> = ({ definition, canStart, onStart }) => {
  return (
    <div>
      <Band title="Start a new application">Start your application for {definition.name}.</Band>
      <Container vs={3} hs={1}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <div>
              <GoAButtonGroup alignment="end">
                <GoAButton type="primary" disabled={!canStart} onClick={onStart}>
                  Start application
                </GoAButton>
              </GoAButtonGroup>
            </div>
          </GridItem>
          <GridItem md={1} />
        </Grid>
      </Container>
    </div>
  );
};

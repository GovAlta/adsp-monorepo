import { GoabButton, GoabButtonGroup } from '@abgov/react-components';
import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import { FunctionComponent, useEffect } from 'react';
import { FormDefinition } from '../state';

interface StartApplicationProps {
  definition: FormDefinition;
  autoCreate: boolean;
  canCreate: boolean;
  onCreate: () => void;
}

export const StartApplication: FunctionComponent<StartApplicationProps> = ({
  definition,
  autoCreate,
  canCreate,
  onCreate,
}) => {
  useEffect(() => {
    if (autoCreate && canCreate) {
      onCreate();
    }
  });

  return (
    <div>
      <Band title="Start a new application">Start your application for {definition.name}.</Band>
      <Container vs={3} hs={1}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <div>
              <GoabButtonGroup alignment="end">
                <GoabButton
                  type="primary"
                  data-testid="form-start-application"
                  disabled={!canCreate}
                  onClick={onCreate}
                >
                  Start application
                </GoabButton>
              </GoabButtonGroup>
            </div>
          </GridItem>
          <GridItem md={1} />
        </Grid>
      </Container>
    </div>
  );
};

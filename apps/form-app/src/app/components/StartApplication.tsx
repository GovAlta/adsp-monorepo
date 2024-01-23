import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import { FunctionComponent } from 'react';
import { FormDefinition } from '../state';

interface StartApplicationProps {
  definition: FormDefinition;
  onStart: () => void;
}

export const StartApplication: FunctionComponent<StartApplicationProps> = ({ definition, onStart }) => {
  return (
    <div>
      <Band title="Start a new application">Start your application for {definition.name}.</Band>
      <Container vs={3} hs={1}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <Grid>
              <GridItem md={12} className="center">
                <div>
                  <GoAButtonGroup alignment="end">
                    <GoAButton type="primary" onClick={onStart}>
                      Start application
                    </GoAButton>
                  </GoAButtonGroup>
                </div>
              </GridItem>
            </Grid>
          </GridItem>
          <GridItem md={1} />
        </Grid>
      </Container>
    </div>
  );
};

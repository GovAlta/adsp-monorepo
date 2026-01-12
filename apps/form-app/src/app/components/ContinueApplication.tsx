import { GoabButton, GoabButtonGroup } from '@abgov/react-components';
import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import { FunctionComponent } from 'react';
import { Form, FormDefinition } from '../state';

interface ContinueApplicationProps {
  definition: FormDefinition;
  form: Form;
  onContinue: () => void;
}

export const ContinueApplication: FunctionComponent<ContinueApplicationProps> = ({ definition, form, onContinue }) => {
  return (
    <div>
      <Band title="Continue your application">
        We found a previous application for {definition.name} created on {form.created.toFormat('LLLL d, yyyy')}.
      </Band>
      <Container vs={3} hs={1}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <div>
              <GoabButtonGroup alignment="end">
                <GoabButton type="primary" data-testid="form-continue-application" onClick={onContinue}>
                  Continue application
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

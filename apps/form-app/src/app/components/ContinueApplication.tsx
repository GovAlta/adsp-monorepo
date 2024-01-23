import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import moment from 'moment';
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
        We found a previous application for {definition.name} created on {moment(form.created).format('MMMM D, YYYY')}.
      </Band>
      <Container vs={3} hs={1}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <Grid>
              <GridItem md={12} className="center">
                <div>
                  <GoAButtonGroup alignment="end">
                    <GoAButton type="primary" onClick={onContinue}>
                      Continue application
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

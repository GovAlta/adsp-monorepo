import React, { useEffect } from 'react';
import Container from '@components/Container';
import { Grid, GridItem } from '@components/Grid';
import { RootState } from '@store/index';
import { GoACard } from '@abgov/react-components/experimental';
import { useSelector } from 'react-redux';

import { CardContent, ServiceLayoutMin, CardLayout, RedirectButton, H2, Paragraph } from './LandingComponents';
export const LandingSample = (): JSX.Element => {
  const chatApiUrl = useSelector((state: RootState) => {
    return state.config.serviceUrls.chatServiceApiUrl;
  });

  //eslint-disable-next-line
  useEffect(() => {}, [chatApiUrl]);
  return (
    <Container>
      <Grid>
        <GridItem md={1} />
        <GridItem md={10}>
          <ServiceLayoutMin>
            <H2>Example apps</H2>
            <Paragraph>
              With the help of the tech-stack in the ADSP we have built apps than can directly fit the need of your
              service team. Check out the list of applications.
            </Paragraph>
          </ServiceLayoutMin>
          <Grid>
            <GridItem md={4} hSpacing={0.5}>
              <GoACard type="primary">
                <CardLayout>
                  <h2>Chat app</h2>
                  <CardContent maxHeight={200}>Chat app description.</CardContent>
                  <RedirectButton name="chat-service" url={`${chatApiUrl}`} label="Learn more" />
                </CardLayout>
              </GoACard>
            </GridItem>
            <GridItem md={4} hSpacing={0.5}></GridItem>

            <GridItem md={4} hSpacing={0.5}></GridItem>
          </Grid>
        </GridItem>
        <GridItem md={1} />
      </Grid>
    </Container>
  );
};

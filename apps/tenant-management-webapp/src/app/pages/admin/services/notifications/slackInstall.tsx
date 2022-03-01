import { GoAIconButton } from '@abgov/react-components/experimental';
import { Grid, GridItem } from '@components/Grid';
import { RootState } from '@store/index';
import { InstalledSlackTeam } from '@store/notification/models';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface SlackTeamProps {
  team: InstalledSlackTeam;
  className?: string;
}
const SlackTeamComponent: FunctionComponent<SlackTeamProps> = ({ team, className }) => {
  return (
    <div className={className}>
      <span>
        <img src={team.icon} alt={team.name} />
      </span>
      <span>
        <h4>
          {team.name}
          <GoAIconButton type="open" onClick={() => window.open(team.url, '_blank')} />
        </h4>
        <div>
          <label>Team ID: </label>
          <span>{team.id}</span>
        </div>
      </span>
    </div>
  );
};

const SlackTeam = styled(SlackTeamComponent)`
  border: 1px solid #ccc;
  padding: 16px;
  display: flex;
  align-items: center;
  & > span:first-child {
    margin-right: 16px;
  }
  & > span:last-child > h4 {
    margin: 0;
  }
`;

export const SlackInstall: FunctionComponent = () => {
  const { installedTeams, authorizationUrl } = useSelector((state: RootState) => state.notification.providers.slack);

  return (
    <section>
      <h2>Slack installations</h2>
      <p>
        Notification service can send Slack messages to the following workspaces. In order to receive messages, invite
        the 'ADSP Notification' application into your channel and create a subscriber with a Slack address of{' '}
        {'<Team ID>/<Channel ID>'}.
      </p>
      <p>
        Your workspace not listed? <a href={authorizationUrl}>Click to add it.</a>
      </p>
      <Grid>
        {installedTeams.map((team) => (
          <GridItem key={team.id}>
            <SlackTeam team={team} />
          </GridItem>
        ))}
      </Grid>
    </section>
  );
};

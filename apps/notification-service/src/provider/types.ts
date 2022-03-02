import { InstallationStore } from '@slack/oauth';

export interface SlackRepository extends InstallationStore {
  getInstalledTeams(): Promise<{ id: string; name: string }[]>;
}

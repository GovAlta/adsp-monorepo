import { type AxiosResponse } from 'axios';
import type { CLIContext, CloudCliConfig, TrackPayload } from '../types';
export declare const VERSION = "v3";
export type ProjectInfo = {
    id: string;
    name: string;
    targetEnvironment?: string;
    displayName?: string;
    nodeVersion?: string;
    region?: string;
    plan?: string;
    url?: string;
};
export type EnvironmentInfo = Record<string, unknown>;
export type EnvironmentDetails = {
    name: string;
    hasLiveDeployment: boolean;
    hasPendingDeployment: boolean;
};
export type ProjectInput = Omit<ProjectInfo, 'id'>;
export type DeployResponse = {
    build_id: string;
    image: string;
};
export type ListProjectsResponse = {
    data: {
        data: string;
    };
};
export type ListEnvironmentsResponse = {
    data: {
        data: EnvironmentInfo[] | Record<string, never>;
    };
};
export type ListLinkProjectsResponse = {
    data: {
        data: ProjectInfo[] | Record<string, never>;
    };
};
export type ListLinkEnvironmentsResponse = {
    data: {
        data: EnvironmentDetails[] | Record<string, never>;
    };
};
export type GetProjectResponse = {
    data: {
        displayName: string;
        updatedAt: string;
        suspendedAt?: string;
        isTrial: boolean;
        environments: string[];
        environmentsDetails: EnvironmentDetails[];
    };
    metadata: {
        dashboardUrls: {
            project: string;
            deployments: string;
        };
    };
};
export type CreateTrialResponse = {
    licenseKey: string;
};
export type CreateProjectResponse = {
    name: string;
    environmentInternalName: string;
    url?: string;
};
export interface CloudApiService {
    deploy(deployInput: {
        filePath: string;
        project: {
            name: string;
            targetEnvironment?: string;
        };
    }, { onUploadProgress, }: {
        onUploadProgress: (progressEvent: {
            loaded: number;
            total?: number;
        }) => void;
    }): Promise<AxiosResponse<DeployResponse>>;
    createProject(createProjectInput: ProjectInput): Promise<{
        data: CreateProjectResponse;
        status: number;
    }>;
    getUserInfo(): Promise<AxiosResponse>;
    config(): Promise<AxiosResponse<CloudCliConfig>>;
    listProjects(): Promise<AxiosResponse<ListProjectsResponse>>;
    listLinkProjects(): Promise<AxiosResponse<ListLinkProjectsResponse>>;
    listEnvironments(project: {
        name: string;
    }): Promise<AxiosResponse<ListEnvironmentsResponse>>;
    listLinkEnvironments(project: {
        name: string;
    }): Promise<AxiosResponse<ListLinkEnvironmentsResponse>>;
    getProject(project: {
        name: string;
    }): Promise<AxiosResponse<GetProjectResponse>>;
    createTrial(createTrialInput: {
        strapiVersion: string;
    }): Promise<AxiosResponse<CreateTrialResponse>>;
    track(event: string, payload?: TrackPayload): Promise<AxiosResponse<void>>;
}
export declare function cloudApiFactory({ logger }: {
    logger: CLIContext['logger'];
}, token?: string): Promise<CloudApiService>;
//# sourceMappingURL=cli-api.d.ts.map
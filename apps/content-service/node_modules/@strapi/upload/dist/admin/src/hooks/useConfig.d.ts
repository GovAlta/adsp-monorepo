import { UseMutationResult, UseQueryResult } from 'react-query';
export declare const useConfig: () => {
    config: UseQueryResult<import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").NotFoundError<string, unknown> | import("../../../shared/contracts/configuration").Configuration | undefined>;
    mutateConfig: UseMutationResult<void, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, import("../../../shared/contracts/configuration").Configuration>;
};

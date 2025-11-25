interface UseLicenseLimitsArgs {
    enabled?: boolean;
}
declare function useLicenseLimits({ enabled }?: UseLicenseLimitsArgs): {
    license: {
        currentActiveUserCount: number;
        enforcementUserCount: number;
        features: (import("../../../../shared/contracts/admin").SSOFeature | import("../../../../shared/contracts/admin").AuditLogsFeature | import("../../../../shared/contracts/admin").ReviewWorkflowsFeature | import("../../../../shared/contracts/admin").ContentReleasesFeature | import("../../../../shared/contracts/admin").ContentHistoryFeature)[];
        isHostedOnStrapiCloud: boolean;
        licenseLimitStatus: unknown;
        permittedSeats: number;
        shouldNotify: boolean;
        shouldStopCreate: boolean;
        type: string;
        isTrial: boolean;
    } | undefined;
    getFeature: <T>(name: "review-workflows" | "sso" | "audit-logs" | "cms-content-releases" | "cms-content-history") => Record<string, T> | undefined;
    isError: boolean;
    isLoading: boolean;
    isTrial: boolean;
};
export { useLicenseLimits };
export type { UseLicenseLimitsArgs };

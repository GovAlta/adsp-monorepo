/// <reference types="lodash" />
export declare const services: {
    homepage: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        getUpcomingReleases(): Promise<import("../../../shared/contracts/releases").Release[]>;
    };
    release: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        create(releaseData: {
            name: string;
            scheduledAt: Date | null;
            timezone: string | null;
        }, { user }: {
            user: import("../../../shared/types").UserInfo;
        }): Promise<any>;
        findOne(id: import("@strapi/types/dist/data").ID, query?: {}): Promise<any>;
        findPage(query?: Partial<Pick<import("../../../shared/contracts/releases").Pagination, "page" | "pageSize">> | undefined): Promise<{
            results: any[];
            pagination: {
                page: number;
                pageSize: number;
                pageCount: number;
                total: number;
            };
        }>;
        findMany(query?: any): Promise<any[]>;
        update(id: import("@strapi/types/dist/data").ID, releaseData: {
            name: string;
            scheduledAt?: Date | null | undefined;
            timezone?: string | null | undefined;
        }, { user }: {
            user: import("../../../shared/types").UserInfo;
        }): Promise<any>;
        getAllComponents(): Promise<any>;
        delete(releaseId: import("@strapi/types/dist/data").ID): Promise<import("../../../shared/contracts/releases").Release>;
        publish(releaseId: import("@strapi/types/dist/data").ID): Promise<Pick<import("../../../shared/contracts/releases").Release, "id" | "releasedAt" | "status"> | null>;
        updateReleaseStatus(releaseId: import("@strapi/types/dist/data").ID): Promise<any>;
    };
    'release-action': ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        create(releaseId: import("@strapi/types/dist/data").ID, action: {
            type: "publish" | "unpublish";
            contentType: import("@strapi/types/dist/uid").ContentType;
            entryDocumentId?: string | undefined;
            locale?: string | undefined;
        }, { disableUpdateReleaseStatus }?: {
            disableUpdateReleaseStatus?: boolean | undefined;
        }): Promise<any>;
        findPage(releaseId: import("@strapi/types/dist/data").ID, query?: (Partial<Pick<import("../../../shared/contracts/releases").Pagination, "page" | "pageSize">> & {
            groupBy?: import("../../../shared/contracts/release-actions").ReleaseActionGroupBy | undefined;
        }) | undefined): Promise<{
            results: any;
            pagination: {
                page: number;
                pageSize: number;
                pageCount: number;
                total: number;
            };
        }>;
        groupActions(actions: import("../../../shared/contracts/release-actions").ReleaseAction[], groupBy: import("../../../shared/contracts/release-actions").ReleaseActionGroupBy): Promise<import("lodash").Dictionary<(null | undefined)[]>>;
        getContentTypeModelsFromActions(actions: import("../../../shared/contracts/release-actions").ReleaseAction[]): Promise<{} | undefined>;
        countActions(query: {
            filters?: ({
                $and?: (any & {
                    $not?: (any & any & {
                        id?: import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & {
                            $not?: import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & {
                                $and?: (import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any))[] | undefined;
                                $or?: (import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any))[] | undefined;
                            }) | undefined;
                        } & {
                            $and?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & {
                                $not?: import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any) | undefined;
                            } & any))[] | undefined;
                            $or?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & {
                                $not?: import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any) | undefined;
                            } & any))[] | undefined;
                        }) | undefined;
                    } & import("@strapi/types/dist/modules/entity-service/params/filters").AbstractAttributesFiltering<"plugin::content-releases.release-action">) | undefined;
                } & {
                    id?: import("@strapi/types/dist/data").ID | ({
                        $null?: boolean | undefined;
                        $notNull?: boolean | undefined;
                    } & {
                        $eq?: import("@strapi/types/dist/data").ID | undefined;
                        $eqi?: import("@strapi/types/dist/data").ID | undefined;
                        $ne?: import("@strapi/types/dist/data").ID | undefined;
                        $nei?: import("@strapi/types/dist/data").ID | undefined;
                        $gt?: import("@strapi/types/dist/data").ID | undefined;
                        $gte?: import("@strapi/types/dist/data").ID | undefined;
                        $lt?: import("@strapi/types/dist/data").ID | undefined;
                        $lte?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $contains?: import("@strapi/types/dist/data").ID | undefined;
                        $notContains?: import("@strapi/types/dist/data").ID | undefined;
                        $containsi?: import("@strapi/types/dist/data").ID | undefined;
                        $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                    } & {
                        $in?: import("@strapi/types/dist/data").ID[] | undefined;
                        $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                    } & {
                        $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                    } & {
                        $not?: import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & any & {
                            $and?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any))[] | undefined;
                            $or?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any))[] | undefined;
                        }) | undefined;
                    } & {
                        $and?: (import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & {
                            $not?: import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any) | undefined;
                        } & any))[] | undefined;
                        $or?: (import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & {
                            $not?: import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any) | undefined;
                        } & any))[] | undefined;
                    }) | undefined;
                } & import("@strapi/types/dist/modules/entity-service/params/filters").AbstractAttributesFiltering<"plugin::content-releases.release-action">)[] | undefined;
                $or?: (any & {
                    $not?: (any & any & {
                        id?: import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & {
                            $not?: import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & {
                                $and?: (import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any))[] | undefined;
                                $or?: (import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any))[] | undefined;
                            }) | undefined;
                        } & {
                            $and?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & {
                                $not?: import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any) | undefined;
                            } & any))[] | undefined;
                            $or?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & {
                                $not?: import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any) | undefined;
                            } & any))[] | undefined;
                        }) | undefined;
                    } & import("@strapi/types/dist/modules/entity-service/params/filters").AbstractAttributesFiltering<"plugin::content-releases.release-action">) | undefined;
                } & {
                    id?: import("@strapi/types/dist/data").ID | ({
                        $null?: boolean | undefined;
                        $notNull?: boolean | undefined;
                    } & {
                        $eq?: import("@strapi/types/dist/data").ID | undefined;
                        $eqi?: import("@strapi/types/dist/data").ID | undefined;
                        $ne?: import("@strapi/types/dist/data").ID | undefined;
                        $nei?: import("@strapi/types/dist/data").ID | undefined;
                        $gt?: import("@strapi/types/dist/data").ID | undefined;
                        $gte?: import("@strapi/types/dist/data").ID | undefined;
                        $lt?: import("@strapi/types/dist/data").ID | undefined;
                        $lte?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $contains?: import("@strapi/types/dist/data").ID | undefined;
                        $notContains?: import("@strapi/types/dist/data").ID | undefined;
                        $containsi?: import("@strapi/types/dist/data").ID | undefined;
                        $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                    } & {
                        $in?: import("@strapi/types/dist/data").ID[] | undefined;
                        $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                    } & {
                        $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                    } & {
                        $not?: import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & any & {
                            $and?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any))[] | undefined;
                            $or?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any))[] | undefined;
                        }) | undefined;
                    } & {
                        $and?: (import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & {
                            $not?: import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any) | undefined;
                        } & any))[] | undefined;
                        $or?: (import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & {
                            $not?: import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any) | undefined;
                        } & any))[] | undefined;
                    }) | undefined;
                } & import("@strapi/types/dist/modules/entity-service/params/filters").AbstractAttributesFiltering<"plugin::content-releases.release-action">)[] | undefined;
            } & {
                $not?: ({
                    $and?: (any & any & {
                        id?: import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & {
                            $not?: import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & {
                                $and?: (import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any))[] | undefined;
                                $or?: (import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any))[] | undefined;
                            }) | undefined;
                        } & {
                            $and?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & {
                                $not?: import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any) | undefined;
                            } & any))[] | undefined;
                            $or?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & {
                                $not?: import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any) | undefined;
                            } & any))[] | undefined;
                        }) | undefined;
                    } & import("@strapi/types/dist/modules/entity-service/params/filters").AbstractAttributesFiltering<"plugin::content-releases.release-action">)[] | undefined;
                    $or?: (any & any & {
                        id?: import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & {
                            $not?: import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & {
                                $and?: (import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any))[] | undefined;
                                $or?: (import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any))[] | undefined;
                            }) | undefined;
                        } & {
                            $and?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & {
                                $not?: import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any) | undefined;
                            } & any))[] | undefined;
                            $or?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & {
                                $not?: import("@strapi/types/dist/data").ID | ({
                                    $null?: boolean | undefined;
                                    $notNull?: boolean | undefined;
                                } & {
                                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                                } & {
                                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                                } & {
                                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                                } & any & any) | undefined;
                            } & any))[] | undefined;
                        }) | undefined;
                    } & import("@strapi/types/dist/modules/entity-service/params/filters").AbstractAttributesFiltering<"plugin::content-releases.release-action">)[] | undefined;
                } & any & {
                    id?: import("@strapi/types/dist/data").ID | ({
                        $null?: boolean | undefined;
                        $notNull?: boolean | undefined;
                    } & {
                        $eq?: import("@strapi/types/dist/data").ID | undefined;
                        $eqi?: import("@strapi/types/dist/data").ID | undefined;
                        $ne?: import("@strapi/types/dist/data").ID | undefined;
                        $nei?: import("@strapi/types/dist/data").ID | undefined;
                        $gt?: import("@strapi/types/dist/data").ID | undefined;
                        $gte?: import("@strapi/types/dist/data").ID | undefined;
                        $lt?: import("@strapi/types/dist/data").ID | undefined;
                        $lte?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $contains?: import("@strapi/types/dist/data").ID | undefined;
                        $notContains?: import("@strapi/types/dist/data").ID | undefined;
                        $containsi?: import("@strapi/types/dist/data").ID | undefined;
                        $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                    } & {
                        $in?: import("@strapi/types/dist/data").ID[] | undefined;
                        $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                    } & {
                        $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                    } & {
                        $not?: import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & any & {
                            $and?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any))[] | undefined;
                            $or?: (import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any))[] | undefined;
                        }) | undefined;
                    } & {
                        $and?: (import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & {
                            $not?: import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any) | undefined;
                        } & any))[] | undefined;
                        $or?: (import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & {
                            $not?: import("@strapi/types/dist/data").ID | ({
                                $null?: boolean | undefined;
                                $notNull?: boolean | undefined;
                            } & {
                                $eq?: import("@strapi/types/dist/data").ID | undefined;
                                $eqi?: import("@strapi/types/dist/data").ID | undefined;
                                $ne?: import("@strapi/types/dist/data").ID | undefined;
                                $nei?: import("@strapi/types/dist/data").ID | undefined;
                                $gt?: import("@strapi/types/dist/data").ID | undefined;
                                $gte?: import("@strapi/types/dist/data").ID | undefined;
                                $lt?: import("@strapi/types/dist/data").ID | undefined;
                                $lte?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                                $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                                $contains?: import("@strapi/types/dist/data").ID | undefined;
                                $notContains?: import("@strapi/types/dist/data").ID | undefined;
                                $containsi?: import("@strapi/types/dist/data").ID | undefined;
                                $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                            } & {
                                $in?: import("@strapi/types/dist/data").ID[] | undefined;
                                $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                            } & {
                                $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                            } & any & any) | undefined;
                        } & any))[] | undefined;
                    }) | undefined;
                } & import("@strapi/types/dist/modules/entity-service/params/filters").AbstractAttributesFiltering<"plugin::content-releases.release-action">) | undefined;
            } & {
                id?: import("@strapi/types/dist/data").ID | ({
                    $null?: boolean | undefined;
                    $notNull?: boolean | undefined;
                } & {
                    $eq?: import("@strapi/types/dist/data").ID | undefined;
                    $eqi?: import("@strapi/types/dist/data").ID | undefined;
                    $ne?: import("@strapi/types/dist/data").ID | undefined;
                    $nei?: import("@strapi/types/dist/data").ID | undefined;
                    $gt?: import("@strapi/types/dist/data").ID | undefined;
                    $gte?: import("@strapi/types/dist/data").ID | undefined;
                    $lt?: import("@strapi/types/dist/data").ID | undefined;
                    $lte?: import("@strapi/types/dist/data").ID | undefined;
                    $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                    $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                    $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                    $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                    $contains?: import("@strapi/types/dist/data").ID | undefined;
                    $notContains?: import("@strapi/types/dist/data").ID | undefined;
                    $containsi?: import("@strapi/types/dist/data").ID | undefined;
                    $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                } & {
                    $in?: import("@strapi/types/dist/data").ID[] | undefined;
                    $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                } & {
                    $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                } & {
                    $not?: import("@strapi/types/dist/data").ID | ({
                        $null?: boolean | undefined;
                        $notNull?: boolean | undefined;
                    } & {
                        $eq?: import("@strapi/types/dist/data").ID | undefined;
                        $eqi?: import("@strapi/types/dist/data").ID | undefined;
                        $ne?: import("@strapi/types/dist/data").ID | undefined;
                        $nei?: import("@strapi/types/dist/data").ID | undefined;
                        $gt?: import("@strapi/types/dist/data").ID | undefined;
                        $gte?: import("@strapi/types/dist/data").ID | undefined;
                        $lt?: import("@strapi/types/dist/data").ID | undefined;
                        $lte?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $contains?: import("@strapi/types/dist/data").ID | undefined;
                        $notContains?: import("@strapi/types/dist/data").ID | undefined;
                        $containsi?: import("@strapi/types/dist/data").ID | undefined;
                        $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                    } & {
                        $in?: import("@strapi/types/dist/data").ID[] | undefined;
                        $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                    } & {
                        $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                    } & any & {
                        $and?: (import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & any & any))[] | undefined;
                        $or?: (import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & any & any))[] | undefined;
                    }) | undefined;
                } & {
                    $and?: (import("@strapi/types/dist/data").ID | ({
                        $null?: boolean | undefined;
                        $notNull?: boolean | undefined;
                    } & {
                        $eq?: import("@strapi/types/dist/data").ID | undefined;
                        $eqi?: import("@strapi/types/dist/data").ID | undefined;
                        $ne?: import("@strapi/types/dist/data").ID | undefined;
                        $nei?: import("@strapi/types/dist/data").ID | undefined;
                        $gt?: import("@strapi/types/dist/data").ID | undefined;
                        $gte?: import("@strapi/types/dist/data").ID | undefined;
                        $lt?: import("@strapi/types/dist/data").ID | undefined;
                        $lte?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $contains?: import("@strapi/types/dist/data").ID | undefined;
                        $notContains?: import("@strapi/types/dist/data").ID | undefined;
                        $containsi?: import("@strapi/types/dist/data").ID | undefined;
                        $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                    } & {
                        $in?: import("@strapi/types/dist/data").ID[] | undefined;
                        $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                    } & {
                        $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                    } & {
                        $not?: import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & any & any) | undefined;
                    } & any))[] | undefined;
                    $or?: (import("@strapi/types/dist/data").ID | ({
                        $null?: boolean | undefined;
                        $notNull?: boolean | undefined;
                    } & {
                        $eq?: import("@strapi/types/dist/data").ID | undefined;
                        $eqi?: import("@strapi/types/dist/data").ID | undefined;
                        $ne?: import("@strapi/types/dist/data").ID | undefined;
                        $nei?: import("@strapi/types/dist/data").ID | undefined;
                        $gt?: import("@strapi/types/dist/data").ID | undefined;
                        $gte?: import("@strapi/types/dist/data").ID | undefined;
                        $lt?: import("@strapi/types/dist/data").ID | undefined;
                        $lte?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                        $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                        $contains?: import("@strapi/types/dist/data").ID | undefined;
                        $notContains?: import("@strapi/types/dist/data").ID | undefined;
                        $containsi?: import("@strapi/types/dist/data").ID | undefined;
                        $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                    } & {
                        $in?: import("@strapi/types/dist/data").ID[] | undefined;
                        $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                    } & {
                        $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                    } & {
                        $not?: import("@strapi/types/dist/data").ID | ({
                            $null?: boolean | undefined;
                            $notNull?: boolean | undefined;
                        } & {
                            $eq?: import("@strapi/types/dist/data").ID | undefined;
                            $eqi?: import("@strapi/types/dist/data").ID | undefined;
                            $ne?: import("@strapi/types/dist/data").ID | undefined;
                            $nei?: import("@strapi/types/dist/data").ID | undefined;
                            $gt?: import("@strapi/types/dist/data").ID | undefined;
                            $gte?: import("@strapi/types/dist/data").ID | undefined;
                            $lt?: import("@strapi/types/dist/data").ID | undefined;
                            $lte?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWith?: import("@strapi/types/dist/data").ID | undefined;
                            $startsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $endsWithi?: import("@strapi/types/dist/data").ID | undefined;
                            $contains?: import("@strapi/types/dist/data").ID | undefined;
                            $notContains?: import("@strapi/types/dist/data").ID | undefined;
                            $containsi?: import("@strapi/types/dist/data").ID | undefined;
                            $notContainsi?: import("@strapi/types/dist/data").ID | undefined;
                        } & {
                            $in?: import("@strapi/types/dist/data").ID[] | undefined;
                            $notIn?: import("@strapi/types/dist/data").ID[] | undefined;
                        } & {
                            $between?: [import("@strapi/types/dist/data").ID, import("@strapi/types/dist/data").ID] | undefined;
                        } & any & any) | undefined;
                    } & any))[] | undefined;
                }) | undefined;
            } & import("@strapi/types/dist/modules/entity-service/params/filters").AbstractAttributesFiltering<"plugin::content-releases.release-action">) | undefined;
        }): Promise<number>;
        update(actionId: import("@strapi/types/dist/data").ID, releaseId: import("@strapi/types/dist/data").ID, update: {
            type: "publish" | "unpublish";
        }): Promise<any>;
        delete(actionId: import("@strapi/types/dist/data").ID, releaseId: import("@strapi/types/dist/data").ID): Promise<any>;
        validateActionsByContentTypes(contentTypeUids: import("@strapi/types/dist/uid").ContentType[]): Promise<void>;
    };
    'release-validation': ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        validateUniqueEntry(releaseId: import("@strapi/types/dist/data").ID, releaseActionArgs: {
            type: "publish" | "unpublish";
            contentType: import("@strapi/types/dist/uid").ContentType;
            entryDocumentId?: string | undefined;
            locale?: string | undefined;
        }): Promise<void>;
        validateEntryData(contentTypeUid: import("@strapi/types/dist/uid").ContentType, entryDocumentId: string | undefined): void;
        validatePendingReleasesLimit(): Promise<void>;
        validateUniqueNameForPendingRelease(name: string, id?: import("@strapi/types/dist/data").ID | undefined): Promise<void>;
        validateScheduledAtIsLaterThanNow(scheduledAt: Date | null): Promise<void>;
    };
    scheduling: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        set(releaseId: import("@strapi/types/dist/data").ID, scheduleDate: Date): Promise<Map<import("@strapi/types/dist/data").ID, string>>;
        cancel(releaseId: import("@strapi/types/dist/data").ID): Map<import("@strapi/types/dist/data").ID, string>;
        getAll(): Map<import("@strapi/types/dist/data").ID, string>;
        syncFromDatabase(): Promise<Map<import("@strapi/types/dist/data").ID, string>>;
    };
    settings: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        update({ settings }: {
            settings: import("../../../shared/contracts/settings").Settings;
        }): Promise<import("../../../shared/contracts/settings").Settings>;
        find(): Promise<import("../../../shared/contracts/settings").Settings>;
    };
};
//# sourceMappingURL=index.d.ts.map
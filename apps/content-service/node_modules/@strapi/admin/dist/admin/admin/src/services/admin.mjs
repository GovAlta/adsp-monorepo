import { prefixFileUrlWithBackendUrl } from '../utils/urls.mjs';
import { adminApi } from './api.mjs';

const admin = adminApi.enhanceEndpoints({
    addTagTypes: [
        'ProjectSettings',
        'LicenseLimits',
        'LicenseTrialTimeLeft'
    ]
}).injectEndpoints({
    endpoints: (builder)=>({
            init: builder.query({
                query: ()=>({
                        url: '/admin/init',
                        method: 'GET'
                    }),
                transformResponse (res) {
                    return res.data;
                },
                providesTags: [
                    'ProjectSettings'
                ]
            }),
            information: builder.query({
                query: ()=>({
                        url: '/admin/information',
                        method: 'GET'
                    }),
                transformResponse (res) {
                    return res.data;
                }
            }),
            telemetryProperties: builder.query({
                query: ()=>({
                        url: '/admin/telemetry-properties',
                        method: 'GET',
                        config: {
                            validateStatus: (status)=>status < 500
                        }
                    }),
                transformResponse (res) {
                    return res.data;
                }
            }),
            projectSettings: builder.query({
                query: ()=>({
                        url: '/admin/project-settings',
                        method: 'GET'
                    }),
                providesTags: [
                    'ProjectSettings'
                ],
                transformResponse (data) {
                    return {
                        authLogo: data.authLogo ? {
                            name: data.authLogo.name,
                            url: prefixFileUrlWithBackendUrl(data.authLogo.url)
                        } : undefined,
                        menuLogo: data.menuLogo ? {
                            name: data.menuLogo.name,
                            url: prefixFileUrlWithBackendUrl(data.menuLogo.url)
                        } : undefined
                    };
                }
            }),
            updateProjectSettings: builder.mutation({
                query: (data)=>({
                        url: '/admin/project-settings',
                        method: 'POST',
                        data,
                        config: {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                        }
                    }),
                invalidatesTags: [
                    'ProjectSettings'
                ]
            }),
            getPlugins: builder.query({
                query: ()=>({
                        url: '/admin/plugins',
                        method: 'GET'
                    })
            }),
            getLicenseLimits: builder.query({
                query: ()=>({
                        url: '/admin/license-limit-information',
                        method: 'GET'
                    }),
                providesTags: [
                    'LicenseLimits'
                ]
            }),
            getLicenseTrialTimeLeft: builder.query({
                query: ()=>({
                        url: '/admin/license-trial-time-left',
                        method: 'GET'
                    }),
                providesTags: [
                    'LicenseTrialTimeLeft'
                ]
            }),
            getGuidedTourMeta: builder.query({
                query: ()=>({
                        url: '/admin/guided-tour-meta',
                        method: 'GET'
                    }),
                providesTags: [
                    'GuidedTourMeta'
                ]
            })
        }),
    overrideExisting: false
});
const { useInitQuery, useTelemetryPropertiesQuery, useInformationQuery, useProjectSettingsQuery, useUpdateProjectSettingsMutation, useGetPluginsQuery, useGetLicenseLimitsQuery, useGetLicenseTrialTimeLeftQuery, useGetGuidedTourMetaQuery } = admin;

export { useGetGuidedTourMetaQuery, useGetLicenseLimitsQuery, useGetLicenseTrialTimeLeftQuery, useGetPluginsQuery, useInformationQuery, useInitQuery, useProjectSettingsQuery, useTelemetryPropertiesQuery, useUpdateProjectSettingsMutation };
//# sourceMappingURL=admin.mjs.map

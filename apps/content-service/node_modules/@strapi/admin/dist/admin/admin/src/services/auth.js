'use strict';

var api = require('./api.js');

const authService = api.adminApi.enhanceEndpoints({
    addTagTypes: [
        'User',
        'Me',
        'ProvidersOptions'
    ]
}).injectEndpoints({
    endpoints: (builder)=>({
            /**
       * ME
       */ getMe: builder.query({
                query: ()=>({
                        method: 'GET',
                        url: '/admin/users/me'
                    }),
                transformResponse (res) {
                    return res.data;
                },
                providesTags: (res)=>res ? [
                        'Me',
                        {
                            type: 'User',
                            id: res.id
                        }
                    ] : [
                        'Me'
                    ]
            }),
            getMyPermissions: builder.query({
                query: ()=>({
                        method: 'GET',
                        url: '/admin/users/me/permissions'
                    }),
                transformResponse (res) {
                    return res.data;
                }
            }),
            updateMe: builder.mutation({
                query: (body)=>({
                        method: 'PUT',
                        url: '/admin/users/me',
                        data: body
                    }),
                transformResponse (res) {
                    return res.data;
                },
                invalidatesTags: [
                    'Me'
                ]
            }),
            getAiToken: builder.query({
                query: ()=>({
                        method: 'GET',
                        url: '/admin/users/me/ai-token'
                    }),
                transformResponse (res) {
                    return res.data;
                }
            }),
            /**
       * Permissions
       */ checkPermissions: builder.query({
                query: (permissions)=>({
                        method: 'POST',
                        url: '/admin/permissions/check',
                        data: permissions
                    })
            }),
            /**
       * Auth methods
       */ login: builder.mutation({
                query: (body)=>({
                        method: 'POST',
                        url: '/admin/login',
                        data: body
                    }),
                transformResponse (res) {
                    return res.data;
                },
                invalidatesTags: [
                    'Me'
                ]
            }),
            logout: builder.mutation({
                query: (body)=>({
                        method: 'POST',
                        url: '/admin/logout',
                        data: body
                    })
            }),
            resetPassword: builder.mutation({
                query: (body)=>({
                        method: 'POST',
                        url: '/admin/reset-password',
                        data: body
                    }),
                transformResponse (res) {
                    return res.data;
                }
            }),
            accessTokenExchange: builder.mutation({
                query: (body)=>({
                        method: 'POST',
                        url: '/admin/access-token',
                        data: body
                    }),
                transformResponse (res) {
                    return res.data;
                }
            }),
            getRegistrationInfo: builder.query({
                query: (registrationToken)=>({
                        url: '/admin/registration-info',
                        method: 'GET',
                        config: {
                            params: {
                                registrationToken
                            }
                        }
                    }),
                transformResponse (res) {
                    return res.data;
                }
            }),
            registerAdmin: builder.mutation({
                query: (body)=>({
                        method: 'POST',
                        url: '/admin/register-admin',
                        data: body
                    }),
                transformResponse (res) {
                    return res.data;
                }
            }),
            registerUser: builder.mutation({
                query: (body)=>({
                        method: 'POST',
                        url: '/admin/register',
                        data: body
                    }),
                transformResponse (res) {
                    return res.data;
                }
            }),
            forgotPassword: builder.mutation({
                query: (body)=>({
                        url: '/admin/forgot-password',
                        method: 'POST',
                        data: body
                    })
            }),
            isSSOLocked: builder.query({
                query: ()=>({
                        url: '/admin/providers/isSSOLocked',
                        method: 'GET'
                    }),
                transformResponse (res) {
                    return res.data;
                }
            }),
            getProviders: builder.query({
                query: ()=>({
                        url: '/admin/providers',
                        method: 'GET'
                    })
            }),
            getProviderOptions: builder.query({
                query: ()=>({
                        url: '/admin/providers/options',
                        method: 'GET'
                    }),
                transformResponse (res) {
                    return res.data;
                },
                providesTags: [
                    'ProvidersOptions'
                ]
            }),
            updateProviderOptions: builder.mutation({
                query: (body)=>({
                        url: '/admin/providers/options',
                        method: 'PUT',
                        data: body
                    }),
                transformResponse (res) {
                    return res.data;
                },
                invalidatesTags: [
                    'ProvidersOptions'
                ]
            })
        }),
    overrideExisting: true
});
const { useCheckPermissionsQuery, useLazyCheckPermissionsQuery, useGetMeQuery, useLoginMutation, useAccessTokenExchangeMutation, useLogoutMutation, useUpdateMeMutation, useResetPasswordMutation, useRegisterAdminMutation, useRegisterUserMutation, useGetRegistrationInfoQuery, useForgotPasswordMutation, useGetMyPermissionsQuery, useGetAiTokenQuery, useLazyGetAiTokenQuery, useIsSSOLockedQuery, useGetProvidersQuery, useGetProviderOptionsQuery, useUpdateProviderOptionsMutation } = authService;

exports.useAccessTokenExchangeMutation = useAccessTokenExchangeMutation;
exports.useCheckPermissionsQuery = useCheckPermissionsQuery;
exports.useForgotPasswordMutation = useForgotPasswordMutation;
exports.useGetAiTokenQuery = useGetAiTokenQuery;
exports.useGetMeQuery = useGetMeQuery;
exports.useGetMyPermissionsQuery = useGetMyPermissionsQuery;
exports.useGetProviderOptionsQuery = useGetProviderOptionsQuery;
exports.useGetProvidersQuery = useGetProvidersQuery;
exports.useGetRegistrationInfoQuery = useGetRegistrationInfoQuery;
exports.useIsSSOLockedQuery = useIsSSOLockedQuery;
exports.useLazyCheckPermissionsQuery = useLazyCheckPermissionsQuery;
exports.useLazyGetAiTokenQuery = useLazyGetAiTokenQuery;
exports.useLoginMutation = useLoginMutation;
exports.useLogoutMutation = useLogoutMutation;
exports.useRegisterAdminMutation = useRegisterAdminMutation;
exports.useRegisterUserMutation = useRegisterUserMutation;
exports.useResetPasswordMutation = useResetPasswordMutation;
exports.useUpdateMeMutation = useUpdateMeMutation;
exports.useUpdateProviderOptionsMutation = useUpdateProviderOptionsMutation;
//# sourceMappingURL=auth.js.map

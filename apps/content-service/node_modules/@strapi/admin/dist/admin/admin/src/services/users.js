'use strict';

var api = require('./api.js');

const usersService = api.adminApi.enhanceEndpoints({
    addTagTypes: [
        'LicenseLimits',
        'User',
        'Role',
        'RolePermissions'
    ]
}).injectEndpoints({
    endpoints: (builder)=>({
            /**
       * users
       */ createUser: builder.mutation({
                query: (body)=>({
                        url: '/admin/users',
                        method: 'POST',
                        data: body
                    }),
                transformResponse: (response)=>response.data,
                invalidatesTags: [
                    'LicenseLimits',
                    {
                        type: 'User',
                        id: 'LIST'
                    },
                    'HomepageKeyStatistics'
                ]
            }),
            updateUser: builder.mutation({
                query: ({ id, ...body })=>({
                        url: `/admin/users/${id}`,
                        method: 'PUT',
                        data: body
                    }),
                invalidatesTags: (_res, _err, { id })=>[
                        {
                            type: 'User',
                            id
                        },
                        {
                            type: 'User',
                            id: 'LIST'
                        }
                    ]
            }),
            getUsers: builder.query({
                query: ({ id, ...params } = {})=>({
                        url: `/admin/users/${id ?? ''}`,
                        method: 'GET',
                        config: {
                            params
                        }
                    }),
                transformResponse: (res)=>{
                    let users = [];
                    if (res.data) {
                        if ('results' in res.data) {
                            if (Array.isArray(res.data.results)) {
                                users = res.data.results;
                            }
                        } else {
                            users = [
                                res.data
                            ];
                        }
                    }
                    return {
                        users,
                        pagination: 'pagination' in res.data ? res.data.pagination : null
                    };
                },
                providesTags: (res, _err, arg)=>{
                    if (typeof arg === 'object' && 'id' in arg) {
                        return [
                            {
                                type: 'User',
                                id: arg.id
                            }
                        ];
                    } else {
                        return [
                            ...res?.users.map(({ id })=>({
                                    type: 'User',
                                    id
                                })) ?? [],
                            {
                                type: 'User',
                                id: 'LIST'
                            }
                        ];
                    }
                }
            }),
            deleteManyUsers: builder.mutation({
                query: (body)=>({
                        url: '/admin/users/batch-delete',
                        method: 'POST',
                        data: body
                    }),
                transformResponse: (res)=>res.data,
                invalidatesTags: [
                    'LicenseLimits',
                    {
                        type: 'User',
                        id: 'LIST'
                    },
                    'HomepageKeyStatistics'
                ]
            }),
            /**
       * roles
       */ createRole: builder.mutation({
                query: (body)=>({
                        url: '/admin/roles',
                        method: 'POST',
                        data: body
                    }),
                transformResponse: (res)=>res.data,
                invalidatesTags: [
                    {
                        type: 'Role',
                        id: 'LIST'
                    }
                ]
            }),
            getRoles: builder.query({
                query: ({ id, ...params } = {})=>({
                        url: `/admin/roles/${id ?? ''}`,
                        method: 'GET',
                        config: {
                            params
                        }
                    }),
                transformResponse: (res)=>{
                    let roles = [];
                    if (res.data) {
                        if (Array.isArray(res.data)) {
                            roles = res.data;
                        } else {
                            roles = [
                                res.data
                            ];
                        }
                    }
                    return roles;
                },
                providesTags: (res, _err, arg)=>{
                    if (typeof arg === 'object' && 'id' in arg) {
                        return [
                            {
                                type: 'Role',
                                id: arg.id
                            }
                        ];
                    } else {
                        return [
                            ...res?.map(({ id })=>({
                                    type: 'Role',
                                    id
                                })) ?? [],
                            {
                                type: 'Role',
                                id: 'LIST'
                            }
                        ];
                    }
                }
            }),
            updateRole: builder.mutation({
                query: ({ id, ...body })=>({
                        url: `/admin/roles/${id}`,
                        method: 'PUT',
                        data: body
                    }),
                transformResponse: (res)=>res.data,
                invalidatesTags: (_res, _err, { id })=>[
                        {
                            type: 'Role',
                            id
                        }
                    ]
            }),
            getRolePermissions: builder.query({
                query: ({ id, ...params })=>({
                        url: `/admin/roles/${id}/permissions`,
                        method: 'GET',
                        config: {
                            params
                        }
                    }),
                transformResponse: (res)=>res.data,
                providesTags: (_res, _err, { id })=>[
                        {
                            type: 'RolePermissions',
                            id
                        }
                    ]
            }),
            updateRolePermissions: builder.mutation({
                query: ({ id, ...body })=>({
                        url: `/admin/roles/${id}/permissions`,
                        method: 'PUT',
                        data: body
                    }),
                transformResponse: (res)=>res.data,
                invalidatesTags: (_res, _err, { id })=>[
                        {
                            type: 'RolePermissions',
                            id
                        }
                    ]
            }),
            /**
       * Permissions
       */ getRolePermissionLayout: builder.query({
                query: (params)=>({
                        url: '/admin/permissions',
                        method: 'GET',
                        config: {
                            params
                        }
                    }),
                transformResponse: (res)=>res.data
            })
        }),
    overrideExisting: false
});
const { useCreateUserMutation, useGetUsersQuery, useUpdateUserMutation, useDeleteManyUsersMutation, useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useGetRolePermissionsQuery, useGetRolePermissionLayoutQuery, useUpdateRolePermissionsMutation } = usersService;
const useAdminUsers = useGetUsersQuery;

exports.useAdminUsers = useAdminUsers;
exports.useCreateRoleMutation = useCreateRoleMutation;
exports.useCreateUserMutation = useCreateUserMutation;
exports.useDeleteManyUsersMutation = useDeleteManyUsersMutation;
exports.useGetRolePermissionLayoutQuery = useGetRolePermissionLayoutQuery;
exports.useGetRolePermissionsQuery = useGetRolePermissionsQuery;
exports.useGetRolesQuery = useGetRolesQuery;
exports.useUpdateRoleMutation = useUpdateRoleMutation;
exports.useUpdateRolePermissionsMutation = useUpdateRolePermissionsMutation;
exports.useUpdateUserMutation = useUpdateUserMutation;
//# sourceMappingURL=users.js.map

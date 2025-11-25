'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactQuery = require('react-query');
var pluginId = require('../pluginId.js');

const editFolderRequest = (put, post, { attrs, id })=>{
    const isEditing = !!id;
    const method = isEditing ? put : post;
    return method(`/upload/folders/${id ?? ''}`, attrs).then((res)=>res.data);
};
const useEditFolder = ()=>{
    const queryClient = reactQuery.useQueryClient();
    const { put, post } = strapiAdmin.useFetchClient();
    const mutation = reactQuery.useMutation((...args)=>editFolderRequest(put, post, ...args), {
        async onSuccess () {
            await queryClient.refetchQueries([
                pluginId.pluginId,
                'folders'
            ], {
                active: true
            });
            await queryClient.refetchQueries([
                pluginId.pluginId,
                'folder',
                'structure'
            ], {
                active: true
            });
        }
    });
    const editFolder = (attrs, id)=>mutation.mutateAsync({
            attrs,
            id
        });
    return {
        ...mutation,
        editFolder,
        status: mutation.status
    };
};

exports.useEditFolder = useEditFolder;
//# sourceMappingURL=useEditFolder.js.map

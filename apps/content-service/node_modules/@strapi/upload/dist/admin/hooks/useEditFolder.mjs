import { useFetchClient } from '@strapi/admin/strapi-admin';
import { useQueryClient, useMutation } from 'react-query';
import { pluginId } from '../pluginId.mjs';

const editFolderRequest = (put, post, { attrs, id })=>{
    const isEditing = !!id;
    const method = isEditing ? put : post;
    return method(`/upload/folders/${id ?? ''}`, attrs).then((res)=>res.data);
};
const useEditFolder = ()=>{
    const queryClient = useQueryClient();
    const { put, post } = useFetchClient();
    const mutation = useMutation((...args)=>editFolderRequest(put, post, ...args), {
        async onSuccess () {
            await queryClient.refetchQueries([
                pluginId,
                'folders'
            ], {
                active: true
            });
            await queryClient.refetchQueries([
                pluginId,
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

export { useEditFolder };
//# sourceMappingURL=useEditFolder.mjs.map

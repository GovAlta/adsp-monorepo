import { jsx } from 'react/jsx-runtime';
import { Modal } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../utils/getTrad.mjs';
import 'qs';
import '../../../constants.mjs';
import '../../../utils/urlYupSchema.mjs';

const EditFolderModalHeader = ({ isEditing = false })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Modal.Header, {
        children: /*#__PURE__*/ jsx(Modal.Title, {
            children: formatMessage(isEditing ? {
                id: getTrad('modal.folder.edit.title'),
                defaultMessage: 'Edit folder'
            } : {
                id: getTrad('modal.folder.create.title'),
                defaultMessage: 'Add new folder'
            })
        })
    });
};

export { EditFolderModalHeader };
//# sourceMappingURL=ModalHeader.mjs.map

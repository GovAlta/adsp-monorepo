import { jsx } from 'react/jsx-runtime';
import { Box, Checkbox } from '@strapi/design-system';
import { useFolderCard } from '../contexts/FolderCard.mjs';

const FolderCardCheckbox = (props)=>{
    const { id } = useFolderCard();
    return /*#__PURE__*/ jsx(Box, {
        position: "relative",
        zIndex: 2,
        children: /*#__PURE__*/ jsx(Checkbox, {
            "aria-labelledby": `${id}-title`,
            ...props
        })
    });
};

export { FolderCardCheckbox };
//# sourceMappingURL=FolderCardCheckbox.mjs.map

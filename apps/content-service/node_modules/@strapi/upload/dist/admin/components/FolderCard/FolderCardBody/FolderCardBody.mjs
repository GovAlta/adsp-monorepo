import { jsx } from 'react/jsx-runtime';
import { Flex } from '@strapi/design-system';
import { styled } from 'styled-components';
import { useFolderCard } from '../contexts/FolderCard.mjs';

const StyledBox = styled(Flex)`
  user-select: none;
`;
const FolderCardBody = (props)=>{
    const { id } = useFolderCard();
    return /*#__PURE__*/ jsx(StyledBox, {
        ...props,
        id: `${id}-title`,
        "data-testid": `${id}-title`,
        alignItems: "flex-start",
        direction: "column",
        maxWidth: "100%",
        overflow: "hidden",
        position: "relative"
    });
};

export { FolderCardBody };
//# sourceMappingURL=FolderCardBody.mjs.map

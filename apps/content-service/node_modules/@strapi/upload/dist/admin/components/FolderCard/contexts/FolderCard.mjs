import { createContext, useContext } from 'react';

const FolderCardContext = /*#__PURE__*/ createContext({});
function useFolderCard() {
    return useContext(FolderCardContext);
}

export { FolderCardContext, useFolderCard };
//# sourceMappingURL=FolderCard.mjs.map

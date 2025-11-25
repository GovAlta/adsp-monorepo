'use strict';

var React = require('react');

const FolderCardContext = /*#__PURE__*/ React.createContext({});
function useFolderCard() {
    return React.useContext(FolderCardContext);
}

exports.FolderCardContext = FolderCardContext;
exports.useFolderCard = useFolderCard;
//# sourceMappingURL=FolderCard.js.map

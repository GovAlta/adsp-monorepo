'use strict';

var userInput;
var hasRequiredUserInput;
function requireUserInput() {
    if (hasRequiredUserInput) return userInput;
    hasRequiredUserInput = 1;
    const usersPermissionsUserUID = 'plugin::users-permissions.user';
    userInput = ({ nexus, strapi })=>{
        const { getContentTypeInputName } = strapi.plugin('graphql').service('utils').naming;
        const userContentType = strapi.getModel(usersPermissionsUserUID);
        const userInputName = getContentTypeInputName(userContentType);
        return nexus.extendInputType({
            type: userInputName,
            definition (t) {
                // Manually add the private password field back to the data
                // input type as it is used for CRUD operations on users
                t.string('password');
            }
        });
    };
    return userInput;
}

exports.__require = requireUserInput;
//# sourceMappingURL=user-input.js.map

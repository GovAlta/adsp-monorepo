'use strict';

/**
 * Retrieves the display name of an admin panel user
 */ const getDisplayName = ({ firstname, lastname, username, email } = {})=>{
    if (username) {
        return username;
    }
    // firstname is not required if the user is created with a username
    if (firstname) {
        return `${firstname} ${lastname ?? ''}`.trim();
    }
    return email ?? '';
};

exports.getDisplayName = getDisplayName;
//# sourceMappingURL=users.js.map

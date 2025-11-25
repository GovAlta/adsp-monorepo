/* -------------------------------------------------------------------------------------------------
 * getDisplayName
 * -----------------------------------------------------------------------------------------------*/ /**
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
/* -------------------------------------------------------------------------------------------------
 * getInitials
 * -----------------------------------------------------------------------------------------------*/ /**
 * Retrieves the initials of the user (based on their firstname / lastname or their display name)
 */ const getInitials = (user = {})=>{
    return user?.firstname && user?.lastname ? `${user.firstname.substring(0, 1)}${user.lastname.substring(0, 1)}` : getDisplayName(user).split(' ').map((name)=>name.substring(0, 1)).join('').substring(0, 1).toUpperCase();
};
/* -------------------------------------------------------------------------------------------------
 * hashAdminUserEmail
 * -----------------------------------------------------------------------------------------------*/ const hashAdminUserEmail = async (payload)=>{
    if (!payload || !payload.email) {
        return null;
    }
    try {
        return await digestMessage(payload.email);
    } catch (error) {
        return null;
    }
};
const bufferToHex = (buffer)=>{
    return [
        ...new Uint8Array(buffer)
    ].map((b)=>b.toString(16).padStart(2, '0')).join('');
};
const digestMessage = async (message)=>{
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    return bufferToHex(hashBuffer);
};

export { getDisplayName, getInitials, hashAdminUserEmail };
//# sourceMappingURL=users.mjs.map

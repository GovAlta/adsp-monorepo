'use strict';

/**
 * Retrieves the value of a specified cookie.
 *
 * @param name - The name of the cookie to retrieve.
 * @returns The decoded cookie value if found, otherwise null.
 */ const getCookieValue = (name)=>{
    let result = null;
    const cookieArray = document.cookie.split(';');
    cookieArray.forEach((cookie)=>{
        const [key, value] = cookie.split('=').map((item)=>item.trim());
        if (key === name) {
            result = decodeURIComponent(value);
        }
    });
    return result;
};
/**
 * Sets a cookie with the given name, value, and optional expiration time.
 *
 * @param name - The name of the cookie.
 * @param value - The value of the cookie.
 * @param days - (Optional) Number of days until the cookie expires. If omitted, the cookie is a session cookie.
 */ const setCookie = (name, value, days)=>{
    let expires = '';
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/${expires}`;
};
/**
 * Deletes a cookie by setting its expiration date to a past date.
 *
 * @param name - The name of the cookie to delete.
 */ const deleteCookie = (name)=>{
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

exports.deleteCookie = deleteCookie;
exports.getCookieValue = getCookieValue;
exports.setCookie = setCookie;
//# sourceMappingURL=cookies.js.map

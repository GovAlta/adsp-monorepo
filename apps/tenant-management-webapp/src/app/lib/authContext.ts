import React from 'react';
interface Actions {}

const AuthContext = React.createContext<Actions>(null);
export default AuthContext;

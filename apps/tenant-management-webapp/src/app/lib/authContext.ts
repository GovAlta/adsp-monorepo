import React from 'react';

interface Actions {
  signIn: (redirectPath: string) => void;
  signOut: () => void;
}

const AuthContext = React.createContext<Actions>(null);
export default AuthContext;

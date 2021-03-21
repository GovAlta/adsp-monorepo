import React from 'react'

interface Actions {
  signIn: (redirectUrl?: string) => void,
  signOut: () => void,
}

const AuthContext = React.createContext<Actions>(null);
export default AuthContext;

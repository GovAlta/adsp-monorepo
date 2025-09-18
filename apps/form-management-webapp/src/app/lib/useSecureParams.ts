import { useParams } from 'react-router-dom';

export const useSecureParams = (paramName: string) => {
  const params = useParams();
  const value = params[paramName];
  if (value === '__proto__' || value === 'constructor' || value === 'prototype') {
    return '';
  }
  return value;
};

export const validateUrn = (urnStr: string): boolean => {
  const pattern = new RegExp("^urn:ads:[a-z0-9][a-z0-9-]{0,31}:[a-z0-9()+,-.:=@;$_!*'%/?#]+$");
  return pattern.test(urnStr);
};

export const validateHostname = (urnStr: string): boolean => {
  const pattern = new RegExp('^[a-z0-9._%+-]+.[a-z0-9.-]+.[a-z]{2,4}$');
  return pattern.test(urnStr);
};

export const validateVersion = (urnStr: string): boolean => {
  const pattern = new RegExp('^[v|V][0-9]');
  return pattern.test(urnStr);
};

export const validatePath = (urnStr: string): boolean => {
  const pattern = new RegExp('^/|(/[a-zA-Z0-9_-]+)+$');
  return pattern.test(urnStr);
};

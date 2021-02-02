export const validateUrn = (urnStr: string) => {
  const pattern = new RegExp(
    "/^urn:[a-z0-9][a-z0-9-]{1,31}:([a-z0-9()+,-.:=@;$_!*']|%(0[1-9a-f]|[1-9a-f][0-9a-f]))+$/i"
  );
  return pattern.test(urnStr);
};

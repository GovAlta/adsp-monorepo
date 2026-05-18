export const getVersionFromDefinitionId = (definitionId: string): number | undefined => {
  const versionMatch = definitionId.match(/-v(\d+)$/);

  return versionMatch ? Number(versionMatch[1]) : undefined;
};

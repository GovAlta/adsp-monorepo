const UNITS: Record<string, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };

// Parses sizes like '20MB', '500 KB' or '1.5GB'. Returns undefined for anything else.
export const parseFileSize = (size: string | undefined): number | undefined => {
  const match = size?.trim().match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  return match ? Number(match[1]) * UNITS[match[2].toUpperCase()] : undefined;
};

// The form definition's limit, capped by the host's: the host enforces its limit on upload, so
// showing a larger one would invite files that are then rejected.
export const resolveMaxFileSize = (formSize: string | undefined, hostSize: string | undefined): string => {
  if (!hostSize) return formSize ?? '';
  if (!formSize) return hostSize;
  const form = parseFileSize(formSize);
  const host = parseFileSize(hostSize);
  if (form === undefined || host === undefined) return hostSize;
  return form <= host ? formSize : hostSize;
};

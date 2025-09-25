export enum SecurityClassification {
  ProtectedA = 'protected a',
  ProtectedB = 'protected b',
  ProtectedC = 'protected c',
  Public = 'public',
}

//Converts the Secure Classifications Enum to a array.
export const SecurityClassificationsOptions: {
  value: string;
  text: string;
}[] = Object.entries(SecurityClassification).map(([value, text]) => ({ value, text }));

export enum SecurityClassifications {
  Protected_A = 'Protected A',
  Protected_B = 'Protected B',
  Protected_C = 'Protected C',
  Public = 'Public',
}

//Converts the Secure Classifications Enum to a array.
export const SecurityClassificationsOptions: {
  value: string;
  text: string;
}[] = Object.entries(SecurityClassifications).map(([value, text]) => ({ value, text }));

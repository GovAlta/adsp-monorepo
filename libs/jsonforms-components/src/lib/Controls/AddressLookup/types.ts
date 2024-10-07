export interface Address {
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface Suggestion {
  Id: string;
  Text: string;
  Highlight: string;
  Cursor: number;
  Description: string;
  Next: string;
}

// clean-code-ignore: RULE-19 — enum fodder for the address dropdowns, with no behaviour of its own.
// Stand-in for libs/condo-tribunal-common/src/schemas/locations.ts in GovAlta-EMU/adsp-applications.
// That repository is not reachable from this one, and the lists are only enum fodder for the
// dropdowns — nothing about page navigation depends on their contents, so a faithful shape is
// enough to reproduce the form.
export const provinceStates = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
];

export const countries = ['Canada'];

// The mailing variants are the wider lists: a respondent or a representative can be outside Canada.
export const mailingProvinceStates = [
  ...provinceStates,
  'Alabama',
  'Alaska',
  'Arizona',
  'California',
  'Colorado',
  'Florida',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Michigan',
  'Minnesota',
  'Montana',
  'Nevada',
  'New York',
  'North Dakota',
  'Oregon',
  'Texas',
  'Washington',
];

export const mailingCountries = [
  'Canada',
  'United States',
  'United Kingdom',
  'Australia',
  'France',
  'Germany',
  'India',
  'Mexico',
  'Philippines',
  'Other',
];

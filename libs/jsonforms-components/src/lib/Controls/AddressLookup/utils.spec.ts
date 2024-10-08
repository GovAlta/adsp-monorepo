import { fetchAddressSuggestions, filterAlbertaAddresses, mapSuggestionToAddress } from './utils';
import axios from 'axios';
import { Suggestion, Address } from './types';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockSuggestions: Suggestion[] = [
  {
    Id: 'CA|CP|A|10010614',
    Text: '1234 Example St',
    Highlight: '1-2',
    Cursor: 0,
    Description: 'Edmonton, AB, T5J 2N9',
    Next: 'Retrieve',
  },
  {
    Id: 'CA|CP|A|10010615',
    Text: '5678 Sample St',
    Highlight: '1-2',
    Cursor: 0,
    Description: 'Vancouver, BC, V6B 1L6',
    Next: 'Retrieve',
  },
];
describe('fetchAddressSuggestions', () => {
  const formUrl = 'http://mockapi.com/address';
  const searchTerm = 'Main St';
  it('should return suggestions on successful API call', async () => {
    const mockResponse = {
      data: {
        Items: [{ Id: '1', Text: '123 Main St', Description: 'AB, Canada' }],
      },
    };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await fetchAddressSuggestions(searchTerm, formUrl, true);

    expect(result).toEqual(mockResponse.data.Items);
  });

  it('should return an empty array on API error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    const result = await fetchAddressSuggestions(searchTerm, formUrl);

    expect(result).toEqual([]);
  });
});
describe('filterAlbertaAddresses', () => {
  it('should filter out non-Alberta addresses', () => {
    const result = filterAlbertaAddresses(mockSuggestions);
    expect(result).toHaveLength(1);
    expect(result[0].Description).toContain('AB');
  });
});

describe('mapSuggestionToAddress', () => {
  it('should map a suggestion to an address object', () => {
    const suggestion: Suggestion = {
      Id: 'CA|CP|A|10010614',
      Text: '1234 Example St',
      Highlight: '1-2',
      Cursor: 0,
      Description: 'Edmonton, AB, T5J 2N9',
      Next: 'Retrieve',
    };

    const expectedAddress: Address = {
      addressLine1: '1234 Example St',
      addressLine2: '',
      city: 'Edmonton',
      province: 'AB',
      postalCode: 'T5J 2N9',
      country: 'CAN',
    };

    const result = mapSuggestionToAddress(suggestion);
    expect(result).toEqual(expectedAddress);
  });
});

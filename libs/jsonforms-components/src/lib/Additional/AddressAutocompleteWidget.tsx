import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GoAInput, GoAFormItem } from '@abgov/react-components-new';

interface Address {
  address1: string;
  address2?: string;
  postalCode: string;
  city: string;
  province: string;
}
const defaultAddress = {
  address1: '',
  address2: '',
  postalCode: '',
  city: '',
  province: '',
};

const AddressAutocomplete: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [address, setAddress] = useState<Address>();
  const [autocomplete, setAutocomplete] = useState<boolean>(false);

  useEffect(() => {
    setAddress(defaultAddress);
    if (query.length > 2) {
      const fetchSuggestions = async () => {
        try {
          const response = await axios.get('https://autosuggest.search.hereapi.com/v1/autosuggest', {
            params: {
              apiKey: 'Ec1tC4wxvqElg6v1m1YWvhZlTifDb3bZM7rJ-t9J4Ig',
              in: 'bbox:-141.00275,41.6765556,-52.3231981,83.3362128',
              q: query,
              limit: 5,
            },
          });
          setSuggestions(response.data.items);
        } catch (error) {
          console.error('Error fetching address suggestions:', error);
        }
      };

      fetchSuggestions();
    }
  }, [query]);

  const handleSelect = (suggestion: any) => {
    if (suggestion?.address?.label) {
      const address = suggestion.address.label.split(',');
      const address1 = address[0] || '';
      const address2 = suggestion.address?.street || '';

      const city = address[1].trim();
      let province = '',
        postalCode = '';

      if (address[2] && address[2].trim().split(' ').length > 1) {
        province = address[2].split(' ')[1].trim();
        if (address[2].split(' ').length === 3) {
          postalCode = address[2].split(' ')[2];
        }
        if (address[2].split(' ').length === 4) {
          postalCode = address[2].split(' ')[2] + ' ' + address[2].split(' ')[3];
        }
      }

      setAddress({ address1, address2, postalCode, city, province });
      setAutocomplete(true);
    }
    setSuggestions([]);
  };

  return (
    <div>
      <GoAFormItem label="Address 1">
        <GoAInput
          type="text"
          value={autocomplete ? (address?.address1 as string) : query}
          name="address1"
          onChange={(name, value) => setQuery(value)}
          placeholder="Enter address 1"
        />
        {suggestions.length > 0 && (
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSelect(suggestion)}>
                {suggestion.title}
              </li>
            ))}
          </ul>
        )}
      </GoAFormItem>
      <div>
        <br />
        <GoAFormItem label="Address 2">
          <GoAInput
            type="text"
            name="address2"
            value={address?.address2 as string}
            placeholder="Address 2"
            readonly={true}
            onChange={() => {}}
          />
        </GoAFormItem>
        <br />
        <GoAFormItem label="postalCode">
          <GoAInput
            type="text"
            name="postalCode"
            value={address?.postalCode as string}
            placeholder="Postal Code"
            readonly={true}
            onChange={() => {}}
          />
        </GoAFormItem>
        <br />
        <GoAFormItem label="City">
          <GoAInput
            type="text"
            name="city"
            value={address?.city as string}
            placeholder="City"
            readonly={true}
            onChange={() => {}}
          />
        </GoAFormItem>
        <br />
        <GoAFormItem label="Province">
          <GoAInput
            type="text"
            name="province"
            value={address?.province as string}
            placeholder="Province"
            readonly={true}
            onChange={() => {}}
          />
        </GoAFormItem>
      </div>
    </div>
  );
};

export default AddressAutocomplete;

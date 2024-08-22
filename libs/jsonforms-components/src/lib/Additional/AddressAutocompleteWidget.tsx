import React, { useState, useEffect, useRef } from 'react';

interface AddressAutocompleteWidgetProps {
  value: string;
  onChange: (value: string) => void;
  uiSchema: any;
}

export const AddressAutocompleteWidget: React.FC<AddressAutocompleteWidgetProps> = ({ value, onChange, uiSchema }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (window.google && inputRef.current) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(inputRef.current!, {
        types: ['address'],
        componentRestrictions: { country: 'ca' }, // Restrict to Canada
      });

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (place && place.address_components) {
          const address1 = place.address_components.find((comp) => comp.types.includes('route'))?.long_name || '';
          const address2 =
            place.address_components.find((comp) => comp.types.includes('sublocality_level_1'))?.long_name || '';
          const postalCode =
            place.address_components.find((comp) => comp.types.includes('postal_code'))?.long_name || '';
          const city = place.address_components.find((comp) => comp.types.includes('locality'))?.long_name || '';
          const province =
            place.address_components.find((comp) => comp.types.includes('administrative_area_level_1'))?.long_name ||
            '';

          onChange({
            address1,
            address2,
            postalCode,
            city,
            province,
          });
        }
      });

      setAutocomplete(autocompleteInstance);
    }
  }, []);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter address 1"
      />
    </div>
  );
};

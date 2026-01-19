import { useEffect } from 'react';

export function useSyncAutofillFields(
  fields: string[],
  // eslint-disable-next-line
  formData: any,
  // eslint-disable-next-line
  updateFormData: (data: any) => void,
  // eslint-disable-next-line
  handleRequiredFieldBlur: (name: string, updatedData?: any) => void
) {
  /* istanbul ignore next */
  useEffect(() => {
    const rAF = requestAnimationFrame(() => {
      const timeout = setTimeout(() => {
        const updated: Record<string, string> = {};

        fields.forEach((field) => {
          const input = document.querySelector<HTMLInputElement>(`goa-input[name="${field}"]`);
          if (input && input.value && !formData?.[field]) {
            updated[field] = input.value;
          }
        });

        if (Object.keys(updated).length > 0) {
          const mergedData = { ...formData, ...updated };
          updateFormData(mergedData);
          Object.keys(updated).forEach((name) => {
            handleRequiredFieldBlur(name, mergedData);
          });
        }
      }, 50);

      return () => clearTimeout(timeout);
    });

    return () => cancelAnimationFrame(rAF);
    //eslint-disable-next-line
  }, [formData]);
}

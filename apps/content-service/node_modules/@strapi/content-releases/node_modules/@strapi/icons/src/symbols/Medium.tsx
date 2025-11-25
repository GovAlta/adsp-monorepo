import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgMedium = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <path
      fill="#32324D"
      d="M18.05 16.007c0 5.019-4.04 9.087-9.025 9.087-4.984 0-9.025-4.07-9.025-9.087C0 10.99 4.04 6.92 9.025 6.92s9.025 4.069 9.025 9.087M27.95 16.007c0 4.724-2.02 8.555-4.512 8.555s-4.513-3.831-4.513-8.555 2.02-8.555 4.513-8.555 4.512 3.83 4.512 8.555M32 16.007c0 4.231-.71 7.664-1.587 7.664s-1.587-3.432-1.587-7.664.71-7.664 1.587-7.664c.876 0 1.587 3.432 1.587 7.664"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgMedium);
export default ForwardRef;

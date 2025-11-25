import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgDateField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#FDF4DC" stroke="#FAE7B9" rx={2.5} />
    <path
      fill="#D9822F"
      d="M21 10h-1.5v-.5a.5.5 0 0 0-1 0v.5h-5v-.5a.5.5 0 0 0-1 0v.5H11a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1m0 3H11v-2h1.5v.5a.5.5 0 0 0 1 0V11h5v.5a.5.5 0 0 0 1 0V11H21z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgDateField);
export default ForwardRef;

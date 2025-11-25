import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgBooleanField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#EAFBE7" stroke="#C6F0C2" rx={2.5} />
    <path
      fill="#328048"
      d="M19 11.5h-6a4.5 4.5 0 1 0 0 9h6a4.5 4.5 0 1 0 0-9m0 7a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgBooleanField);
export default ForwardRef;

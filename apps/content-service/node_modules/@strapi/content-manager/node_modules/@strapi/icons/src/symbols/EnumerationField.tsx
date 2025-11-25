import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgEnumerationField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#F6ECFC" stroke="#E0C1F4" rx={2.5} />
    <path
      fill="#9736E8"
      d="M12.75 12a.75.75 0 0 1 .75-.75h8a.75.75 0 1 1 0 1.5h-8a.75.75 0 0 1-.75-.75m8.75 3.25h-8a.75.75 0 1 0 0 1.5h8a.75.75 0 1 0 0-1.5m0 4h-8a.75.75 0 1 0 0 1.5h8a.75.75 0 1 0 0-1.5M10.75 15a1 1 0 1 0 0 2 1 1 0 0 0 0-2m0-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2m0 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgEnumerationField);
export default ForwardRef;

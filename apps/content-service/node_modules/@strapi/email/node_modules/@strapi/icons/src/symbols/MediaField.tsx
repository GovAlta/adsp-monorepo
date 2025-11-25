import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgMediaField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#F6ECFC" stroke="#E0C1F4" rx={2.5} />
    <path
      fill="#9736E8"
      d="M21.5 10.5h-11a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1m-3.75 3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5m-7.25 7v-1.75l3.25-3.25 5 5zm11 0h-1.336l-2.25-2.25 1.25-1.25 2.336 2.336z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgMediaField);
export default ForwardRef;

import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgUidField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#F0F0FF" stroke="#D9D8FF" rx={2.5} />
    <path
      fill="#4945FF"
      d="M18 9a5.005 5.005 0 0 0-4.756 6.549l-3.598 3.597a.5.5 0 0 0-.146.354V22a.5.5 0 0 0 .5.5h2.5a.5.5 0 0 0 .5-.5v-1h1a.5.5 0 0 0 .5-.5v-1h1a.5.5 0 0 0 .354-.146l.597-.598A5 5 0 1 0 18 9m1.25 4.75a1 1 0 1 1 0-2 1 1 0 0 1 0 2"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgUidField);
export default ForwardRef;

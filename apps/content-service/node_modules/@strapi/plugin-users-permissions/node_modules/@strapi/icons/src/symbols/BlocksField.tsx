import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgBlocksField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#EAF5FF" stroke="#B8E1FF" rx={2.5} />
    <path
      fill="#0C75AF"
      d="M14.75 11.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3.5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2M13.75 15a1 1 0 1 0 0 2 1 1 0 0 0 0-2m4.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-4.5 4.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2m4.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgBlocksField);
export default ForwardRef;

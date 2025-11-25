import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgMarkdownField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#EAF5FF" stroke="#B8E1FF" rx={2.5} />
    <path
      fill="#0C75AF"
      d="M9.75 12a.75.75 0 0 1 .75-.75h11a.75.75 0 1 1 0 1.5h-11a.75.75 0 0 1-.75-.75m.75 3.25h8a.75.75 0 1 0 0-1.5h-8a.75.75 0 1 0 0 1.5m11 1h-11a.75.75 0 1 0 0 1.5h11a.75.75 0 1 0 0-1.5m-3 2.5h-8a.75.75 0 1 0 0 1.5h8a.75.75 0 1 0 0-1.5"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgMarkdownField);
export default ForwardRef;

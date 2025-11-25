import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgTextField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#EAFBE7" stroke="#C6F0C2" rx={2.5} />
    <path
      fill="#328048"
      d="M13.679 11.18a.75.75 0 0 0-1.358 0l-4 8.5a.75.75 0 0 0 1.357.64l.974-2.07h4.695l.974 2.07a.75.75 0 1 0 1.358-.64zm-2.32 5.57 1.64-3.489 1.643 3.489zm9.14-3c-.865 0-1.547.241-2.027.717a.749.749 0 1 0 1.056 1.063c.188-.187.516-.283.972-.283.584 0 1.074.323 1.21.757a3 3 0 0 0-1.21-.254c-1.516 0-2.75 1.121-2.75 2.5s1.234 2.5 2.75 2.5c.479.001.95-.114 1.375-.336A.75.75 0 0 0 23.25 20v-3.75c0-1.379-1.234-2.5-2.75-2.5m0 5.5c-.687 0-1.25-.449-1.25-1s.563-1 1.25-1 1.25.449 1.25 1-.562 1-1.25 1"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgTextField);
export default ForwardRef;

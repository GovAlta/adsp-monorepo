import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgComponentField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#F6F6F9" stroke="#DCDCE4" rx={2.5} />
    <path
      fill="#666687"
      d="M20.5 17.5c-.358 0-.71.085-1.029.25l-1.337-1.04q.11-.326.116-.67l.647-.214a2.25 2.25 0 1 0-.637-1.37l-.486.162A2.25 2.25 0 0 0 16 13.75c-.062 0-.117 0-.176.008l-.278-.625A2.25 2.25 0 1 0 14 13.75c.063 0 .117 0 .176-.008l.278.625a2.24 2.24 0 0 0-.537 2.482l-1.33 1.182a2.25 2.25 0 1 0 .996 1.12l1.33-1.182a2.25 2.25 0 0 0 2.3-.075l1.224.954A2.25 2.25 0 1 0 20.5 17.5m0-4a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5m-7.25-2a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0m-1.75 9.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5M15.25 16a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0m5.25 4.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponentField);
export default ForwardRef;

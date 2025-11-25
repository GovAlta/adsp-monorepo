import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgDynamicZoneField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#F6F6F9" stroke="#DCDCE4" rx={2.5} />
    <path
      fill="#666687"
      d="M23.75 16a3.75 3.75 0 0 1-6.402 2.652l-.03-.033-3.742-4.225a2.25 2.25 0 1 0 0 3.212l.193-.218a.75.75 0 1 1 1.125.994l-.21.237-.03.033a3.75 3.75 0 1 1 0-5.304l.03.033 3.742 4.225a2.25 2.25 0 1 0 0-3.212l-.193.218a.751.751 0 1 1-1.125-.995l.21-.236.03-.033A3.75 3.75 0 0 1 23.75 16"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgDynamicZoneField);
export default ForwardRef;

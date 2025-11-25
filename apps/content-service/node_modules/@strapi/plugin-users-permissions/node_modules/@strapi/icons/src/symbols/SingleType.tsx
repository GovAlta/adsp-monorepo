import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgSingleType = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#0C75AF" stroke="#0C75AF" rx={2.5} />
    <path
      fill="#fff"
      d="M8.523 17.586h1.711c.123.727.844 1.195 1.758 1.195.95 0 1.606-.445 1.606-1.107 0-.492-.352-.797-1.266-1.084l-.879-.276c-1.248-.386-1.963-1.218-1.963-2.308 0-1.547 1.418-2.678 3.328-2.678 1.858 0 3.164 1.078 3.217 2.62h-1.67c-.105-.71-.744-1.184-1.617-1.184-.826 0-1.459.433-1.459 1.03 0 .47.34.815 1.137 1.067l.867.27c1.436.451 2.086 1.154 2.086 2.297 0 1.675-1.418 2.789-3.516 2.789-1.922 0-3.234-.99-3.34-2.631M20.107 20h-1.78l1.487-6.943h-2.53l.31-1.512h6.843l-.31 1.512h-2.531z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgSingleType);
export default ForwardRef;

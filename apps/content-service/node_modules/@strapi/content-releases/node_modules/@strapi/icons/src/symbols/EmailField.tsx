import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgEmailField = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#FCECEA" stroke="#F5C0B8" rx={2.5} />
    <path
      fill="#D02B20"
      d="M16 9.25a6.75 6.75 0 0 0 0 13.5c1.392 0 2.856-.42 3.915-1.125a.75.75 0 1 0-.83-1.25c-.813.54-1.994.875-3.085.875A5.25 5.25 0 1 1 21.25 16c0 .58-.104 1.067-.293 1.372-.165.265-.375.378-.707.378s-.542-.113-.707-.378c-.187-.305-.293-.791-.293-1.372v-2.5a.75.75 0 0 0-1.468-.216 3.25 3.25 0 1 0 .554 4.973c.433.637 1.09.993 1.914.993 1.542 0 2.5-1.245 2.5-3.25A6.76 6.76 0 0 0 16 9.25m0 8.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgEmailField);
export default ForwardRef;

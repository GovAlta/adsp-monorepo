import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgInformationSquare = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <path fill="#4945FF" d="M0 4a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4z" />
    <path
      fill="#fff"
      d="M15.733 8c.343 0 .678.108.963.31s.507.49.639.826c.13.337.165.707.098 1.064a1.9 1.9 0 0 1-.474.942 1.7 1.7 0 0 1-.887.504 1.64 1.64 0 0 1-1.002-.105 1.76 1.76 0 0 1-.778-.678A1.9 1.9 0 0 1 14 9.841a1.9 1.9 0 0 1 .508-1.302c.325-.345.766-.539 1.225-.539M20 24h-8v-2.265h2.933v-6.23H12.8v-2.266h4.267v8.496H20z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgInformationSquare);
export default ForwardRef;

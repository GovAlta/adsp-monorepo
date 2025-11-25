import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgCodeSquare = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <path fill="#D9822F" d="M0 4a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4z" />
    <path
      fill="#fff"
      fillRule="evenodd"
      d="M17.143 18.659v2.912l6.856-3.878v-2.815L17.143 11v2.906l4.16 2.38zm-2.287 0-4.16-2.374 4.16-2.38V11L8 14.877v2.816l6.856 3.878z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgCodeSquare);
export default ForwardRef;

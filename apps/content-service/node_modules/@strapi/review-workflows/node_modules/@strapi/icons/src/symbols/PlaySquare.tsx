import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgPlaySquare = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <path fill="#66B7F1" d="M0 4a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4z" />
    <path
      fill="#fff"
      fillRule="evenodd"
      d="M12 10.921a.5.5 0 0 1 .773-.419l8.582 5.579a.5.5 0 0 1 0 .838l-8.582 5.579a.5.5 0 0 1-.773-.42z"
      clipRule="evenodd"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgPlaySquare);
export default ForwardRef;

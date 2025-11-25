import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgCollectionType = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <rect width={31} height={23} x={0.5} y={4.5} fill="#4945FF" stroke="#4945FF" rx={2.5} />
    <path
      fill="#fff"
      d="M14.328 14.54v-.083c-.04-.937-.75-1.559-1.787-1.559-1.535 0-2.725 1.57-2.725 3.65 0 1.302.71 2.104 1.846 2.104.961 0 1.787-.545 2.063-1.37h1.752c-.37 1.78-1.922 2.935-3.967 2.935-2.121 0-3.504-1.395-3.504-3.545 0-3.123 1.951-5.344 4.646-5.344 1.94 0 3.41 1.283 3.41 2.96 0 .087 0 .163-.011.251zM20.053 20H18.27l1.489-6.943h-2.532l.311-1.512h6.844l-.31 1.512H21.54z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgCollectionType);
export default ForwardRef;

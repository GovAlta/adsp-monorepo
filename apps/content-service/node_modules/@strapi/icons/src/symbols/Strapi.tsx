import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgStrapi = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <path
      fill="#4945FF"
      d="M0 11.093c0-5.23 0-7.844 1.625-9.468C3.249 0 5.864 0 11.093 0h9.814c5.23 0 7.844 0 9.468 1.625C32 3.249 32 5.864 32 11.093v9.814c0 5.23 0 7.844-1.625 9.468C28.751 32 26.136 32 20.907 32h-9.814c-5.23 0-7.844 0-9.468-1.625C0 28.751 0 26.136 0 20.907z"
    />
    <path
      fill="#fff"
      fillRule="evenodd"
      d="M22.08 9.707H11.307V15.2H16.8v5.493h5.493V9.92a.213.213 0 0 0-.213-.213"
      clipRule="evenodd"
    />
    <path fill="#fff" d="M16.8 15.2h-.213v.213h.213z" />
    <path
      fill="#9593FF"
      d="M11.307 15.2h5.28c.117 0 .213.096.213.213v5.28h-5.28a.213.213 0 0 1-.213-.213zM16.8 20.693h5.493l-5.31 5.312a.107.107 0 0 1-.183-.076zM11.307 15.2H6.07a.107.107 0 0 1-.076-.182l5.312-5.311z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgStrapi);
export default ForwardRef;

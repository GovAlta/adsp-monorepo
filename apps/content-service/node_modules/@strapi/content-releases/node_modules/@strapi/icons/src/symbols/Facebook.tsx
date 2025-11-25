import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgFacebook = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <path
      fill="#1977F3"
      d="M32 16c0-8.836-7.164-16-16-16S0 7.164 0 16c0 7.985 5.85 14.605 13.5 15.807v-11.18H9.437V16H13.5v-3.526c0-4.01 2.39-6.226 6.044-6.226 1.75 0 3.582.313 3.582.313V10.5h-2.018c-1.987 0-2.608 1.233-2.608 2.5V16h4.437l-.709 4.626H18.5v11.18C26.15 30.607 32 23.989 32 16"
    />
    <path
      fill="#FEFEFE"
      d="M22.228 20.626 22.937 16H18.5v-3.002c0-1.264.619-2.5 2.608-2.5h2.018V6.562s-1.832-.313-3.582-.313c-3.654 0-6.044 2.214-6.044 6.226V16H9.437v4.626H13.5v11.18Q14.724 32 16 32c.85 0 1.685-.068 2.5-.194v-11.18z"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgFacebook);
export default ForwardRef;

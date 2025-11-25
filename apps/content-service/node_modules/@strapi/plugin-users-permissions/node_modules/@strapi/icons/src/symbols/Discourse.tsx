import type { SVGProps } from 'react';
import { Ref, forwardRef } from 'react';
const SvgDiscourse = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} ref={ref} {...props}>
    <path
      fill="#231F20"
      d="M15.659.302C7.158.302 0 7.194 0 15.698v15.943l15.656-.015c8.501 0 15.396-7.158 15.396-15.66 0-8.5-6.901-15.664-15.393-15.664"
    />
    <path
      fill="#FFF9AE"
      d="M15.81 6.261a9.546 9.546 0 0 0-8.39 14.09l-1.726 5.554 6.2-1.4A9.541 9.541 0 1 0 15.82 6.26z"
    />
    <path
      fill="#00AEEF"
      d="M23.381 9.999a9.54 9.54 0 0 1-11.487 14.49l-6.2 1.419 6.312-.746A9.54 9.54 0 0 0 23.381 10"
    />
    <path
      fill="#00A94F"
      d="M21.624 8.239a9.54 9.54 0 0 1-9.91 15.61l-6.02 2.059 6.2-1.404a9.54 9.54 0 0 0 9.73-16.265"
    />
    <path fill="#F15D22" d="M7.991 20.562A9.542 9.542 0 0 1 23.387 9.994 9.543 9.543 0 0 0 7.42 20.35l-1.726 5.555z" />
    <path fill="#E31B23" d="M7.42 20.35A9.543 9.543 0 0 1 21.624 8.238 9.543 9.543 0 0 0 6.832 20.202l-1.135 5.706z" />
  </svg>
);
const ForwardRef = forwardRef(SvgDiscourse);
export default ForwardRef;

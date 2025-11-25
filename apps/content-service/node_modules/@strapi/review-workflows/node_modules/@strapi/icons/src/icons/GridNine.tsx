import type { SVGProps } from "react";
import { Ref, forwardRef } from "react";
import { DefaultTheme, useTheme } from 'styled-components';
interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'fill' | 'stroke'> {
  /**
   * @default "currentColor"
   */
  fill?: keyof DefaultTheme['colors'] | (string & {});
  stroke?: keyof DefaultTheme['colors'] | (string & {});
}
const SvgGridNine = ({
  fill: fillProp = "currentColor",
  stroke: strokeProp,
  ...props
}: IconProps, ref: Ref<SVGSVGElement>) => {
  const {
    colors
  } = useTheme();
  const fill = fillProp && fillProp in colors ? colors[fillProp as keyof DefaultTheme['colors']] : fillProp;
  const stroke = strokeProp && strokeProp in colors ? colors[strokeProp as keyof DefaultTheme['colors']] : strokeProp;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} fill={fill} stroke={stroke} ref={ref} {...props}><path d="M10.5 6.5v5h-7A.5.5 0 0 1 3 11V8a2 2 0 0 1 2-2h5a.5.5 0 0 1 .5.5m2 19a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-5h-7zM3 21v3a2 2 0 0 0 2 2h5a.5.5 0 0 0 .5-.5v-5h-7a.5.5 0 0 0-.5.5m0-7v4a.5.5 0 0 0 .5.5h7v-5h-7a.5.5 0 0 0-.5.5m16-8h-6a.5.5 0 0 0-.5.5v5h7v-5A.5.5 0 0 0 19 6m9.5 7.5h-7v5h7a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5m-16 5h7v-5h-7zM27 6h-5a.5.5 0 0 0-.5.5v5h7a.5.5 0 0 0 .5-.5V8a2 2 0 0 0-2-2m1.5 14.5h-7v5a.5.5 0 0 0 .5.5h5a2 2 0 0 0 2-2v-3a.5.5 0 0 0-.5-.5" /></svg>;
};
const ForwardRef = forwardRef(SvgGridNine);
export default ForwardRef;
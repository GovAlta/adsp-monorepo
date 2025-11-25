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
const SvgArrowDown = ({
  fill: fillProp = "currentColor",
  stroke: strokeProp,
  ...props
}: IconProps, ref: Ref<SVGSVGElement>) => {
  const {
    colors
  } = useTheme();
  const fill = fillProp && fillProp in colors ? colors[fillProp as keyof DefaultTheme['colors']] : fillProp;
  const stroke = strokeProp && strokeProp in colors ? colors[strokeProp as keyof DefaultTheme['colors']] : strokeProp;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} fill={fill} stroke={stroke} ref={ref} {...props}><path d="m26.061 19.061-9 9a1.503 1.503 0 0 1-2.125 0l-9-9a1.503 1.503 0 1 1 2.125-2.125l6.439 6.439V5a1.5 1.5 0 1 1 3 0v18.375l6.439-6.44a1.502 1.502 0 1 1 2.125 2.125z" /></svg>;
};
const ForwardRef = forwardRef(SvgArrowDown);
export default ForwardRef;
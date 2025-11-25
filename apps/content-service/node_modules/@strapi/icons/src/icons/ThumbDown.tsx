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
const SvgThumbDown = ({
  fill: fillProp = "currentColor",
  stroke: strokeProp,
  ...props
}: IconProps, ref: Ref<SVGSVGElement>) => {
  const {
    colors
  } = useTheme();
  const fill = fillProp && fillProp in colors ? colors[(fillProp as keyof DefaultTheme['colors'])] : fillProp;
  const stroke = strokeProp && strokeProp in colors ? colors[(strokeProp as keyof DefaultTheme['colors'])] : strokeProp;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} fill={fill} stroke={stroke} ref={ref} {...props}><path d="m29.978 19.625-1.5-12A3 3 0 0 0 25.5 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h5.383l4.722 9.448A1 1 0 0 0 15 30a5 5 0 0 0 5-5v-2h7a3 3 0 0 0 2.977-3.375M9 18H4V7h5z" /></svg>;
};
const ForwardRef = forwardRef(SvgThumbDown);
export default ForwardRef;
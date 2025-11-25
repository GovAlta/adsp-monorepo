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
const SvgManyToOne = ({
  fill: fillProp = "currentColor",
  stroke: strokeProp,
  ...props
}: IconProps, ref: Ref<SVGSVGElement>) => {
  const {
    colors
  } = useTheme();
  const fill = fillProp && fillProp in colors ? colors[(fillProp as keyof DefaultTheme['colors'])] : fillProp;
  const stroke = strokeProp && strokeProp in colors ? colors[(strokeProp as keyof DefaultTheme['colors'])] : strokeProp;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} fill={fill} stroke={stroke} ref={ref} {...props}><path fillRule="evenodd" d="M14.8 8.254a4 4 0 1 0-1.082 1.682l7.483 4.81a4 4 0 0 0-.075.254H10.874A4.002 4.002 0 0 0 3 16a4 4 0 0 0 7.874 1h10.252q.033.128.075.254l-7.484 4.81a4 4 0 1 0 1.082 1.682l7.484-4.81a4 4 0 1 0 0-5.871zM11 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4M9 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0m16 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4" clipRule="evenodd" /></svg>;
};
const ForwardRef = forwardRef(SvgManyToOne);
export default ForwardRef;
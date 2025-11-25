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
const SvgPencil = ({
  fill: fillProp = "currentColor",
  stroke: strokeProp,
  ...props
}: IconProps, ref: Ref<SVGSVGElement>) => {
  const {
    colors
  } = useTheme();
  const fill = fillProp && fillProp in colors ? colors[(fillProp as keyof DefaultTheme['colors'])] : fillProp;
  const stroke = strokeProp && strokeProp in colors ? colors[(strokeProp as keyof DefaultTheme['colors'])] : strokeProp;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={16} height={16} fill={fill} stroke={stroke} ref={ref} {...props}><path d="m28.414 9.171-5.585-5.586a2 2 0 0 0-2.829 0L4.586 19A1.98 1.98 0 0 0 4 20.414V26a2 2 0 0 0 2 2h5.586A1.98 1.98 0 0 0 13 27.414L28.414 12a2 2 0 0 0 0-2.829M24 13.585 18.414 8l3-3L27 10.585z" /></svg>;
};
const ForwardRef = forwardRef(SvgPencil);
export default ForwardRef;
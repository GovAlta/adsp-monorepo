import type { SVGProps } from "react";
import { DefaultTheme } from 'styled-components';
interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'fill' | 'stroke'> {
    /**
     * @default "currentColor"
     */
    fill?: keyof DefaultTheme['colors'] | (string & {});
    stroke?: keyof DefaultTheme['colors'] | (string & {});
}
declare const ForwardRef: import("react").ForwardRefExoticComponent<Omit<IconProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
export default ForwardRef;
//# sourceMappingURL=Key.d.ts.map
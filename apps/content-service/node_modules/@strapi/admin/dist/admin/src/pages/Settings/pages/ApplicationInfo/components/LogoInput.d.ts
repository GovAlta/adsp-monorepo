import { CarouselInputProps } from '@strapi/design-system';
import { ConfigurationContextValue } from '../../../../../features/Configuration';
import { ImageAsset } from '../utils/files';
interface LogoInputProps extends Pick<PendingLogoDialogProps, 'onChangeLogo'>, Pick<CarouselInputProps, 'label' | 'hint'> {
    canUpdate: boolean;
    customLogo?: ConfigurationContextValue['logos']['auth']['custom'];
    defaultLogo: string;
}
declare const LogoInput: ({ canUpdate, customLogo, defaultLogo, hint, label, onChangeLogo, }: LogoInputProps) => import("react/jsx-runtime").JSX.Element;
interface PendingLogoDialogProps {
    onChangeLogo: (file: ImageAsset | null) => void;
}
export { LogoInput };
export type { LogoInputProps };

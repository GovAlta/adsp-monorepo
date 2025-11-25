import * as React from 'react';
import { ButtonProps } from '@strapi/design-system';
interface CreateActionCEProps extends Pick<ButtonProps, 'onClick'> {
}
declare const CreateActionCE: React.ForwardRefExoticComponent<CreateActionCEProps & React.RefAttributes<HTMLButtonElement>>;
export { CreateActionCE };
export type { CreateActionCEProps };

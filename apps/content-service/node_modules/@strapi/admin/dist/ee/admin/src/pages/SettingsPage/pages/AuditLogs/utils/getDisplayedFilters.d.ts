import { IntlShape } from 'react-intl';
import { Filters } from '../../../../../../../../admin/src/components/Filters';
import { SanitizedAdminUser } from '../../../../../../../../shared/contracts/shared';
export declare const getDisplayedFilters: ({ formatMessage, users, canReadUsers, }: {
    formatMessage: IntlShape['formatMessage'];
    users: SanitizedAdminUser[];
    canReadUsers: boolean;
}) => Filters.Filter[];

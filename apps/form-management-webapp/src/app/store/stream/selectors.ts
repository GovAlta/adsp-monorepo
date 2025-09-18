import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { EditModalType, InitStream, Streams, Stream } from './models';
import { selectModalStateByType } from '@store/session/selectors';
import { ModalState } from '@store/session/models';

export const selectTenantStreams = createSelector(
  (state: RootState) => state?.stream?.tenant,
  (tenantStreams: Streams) => {
    return tenantStreams;
  }
);

export const selectTenantStreamById = createSelector(
  (state: RootState) => state?.stream?.tenant,
  (_, id: string) => id,
  (tenantStreams: Streams, id) => {
    // eslint-disable-next-line
    const [key, stream] = Object.entries(tenantStreams).find(([_id, stream]) => _id === id) as [string, Stream];
    return stream;
  }
);

export const selectAddEditInitStream = createSelector(
  selectModalStateByType(EditModalType),
  (state) => state,
  (editModal: ModalState, state) => {
    if (editModal?.id && editModal?.id?.length > 0) return selectTenantStreamById(state, editModal.id);
    return InitStream;
  }
);

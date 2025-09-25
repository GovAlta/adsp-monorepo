import { RootState } from '../../store';

export const selectModalStateByType = (Type) => (state: RootState) => {
  return { ...state.session?.modal?.[Type] };
};



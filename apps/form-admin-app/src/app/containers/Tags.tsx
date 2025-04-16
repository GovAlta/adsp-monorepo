import { GoAFilterChip, GoAIconButton, GoASkeleton } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import { AppDispatch, AppState, directoryBusySelector, resourceTagsSelector, Tag, untagResource } from '../state';
import { useDispatch, useSelector } from 'react-redux';

const TagBadge: FunctionComponent<{ tag: Tag; onDelete: () => void }> = ({ tag, onDelete }) => {
  return <GoAFilterChip content={tag.label} onClick={onDelete} mr="xs" mb="xs" />;
};

interface TagsProps {
  urn: string;
  onTag: () => void;
}

export const Tags: FunctionComponent<TagsProps> = ({ urn, onTag }) => {
  const dispatch = useDispatch<AppDispatch>();

  const { loadingResourceTags } = useSelector(directoryBusySelector);
  const tags = useSelector((state: AppState) => resourceTagsSelector(state, urn));

  return (
    <>
      {loadingResourceTags[urn] ? (
        <GoASkeleton type="text-small" />
      ) : (
        tags?.map((tag) => (
          <TagBadge key={tag.value} tag={tag} onDelete={() => dispatch(untagResource({ urn, tag }))} />
        ))
      )}
      <GoAIconButton title="add tag" icon="add-circle" variant="color" onClick={onTag} />
    </>
  );
};

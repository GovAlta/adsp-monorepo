import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabModal,
} from '@abgov/react-components';
import type { GoabDropdownOnChangeDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { fetchDirectory } from '@store/directory/actions';
import { selectSortedDirectory } from '@store/directory/selectors';
import {
  TOKEN_HANDLER_ID_MAX_LENGTH,
  TOKEN_HANDLER_ID_PATTERN,
  TokenHandlerTarget,
} from '@store/tokenHandler/models';

interface Props {
  target: TokenHandlerTarget | null;
  existingIds: string[];
  onSave: (target: TokenHandlerTarget) => void;
  onClose: () => void;
}

export const TokenHandlerTargetModal: FunctionComponent<Props> = ({ target, existingIds, onSave, onClose }) => {
  const dispatch = useDispatch();
  const isNew = !target;
  const [id, setId] = useState(target?.id || '');
  const [upstream, setUpstream] = useState(target?.upstream || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { tenantDirectory, coreDirectory } = useSelector(selectSortedDirectory);

  useEffect(() => {
    dispatch(fetchDirectory());
  }, [dispatch]);

  // Tenant entries first, then core; keep a current value that is no longer in the directory selectable.
  const upstreamOptions = useMemo(() => {
    const urns = [...(tenantDirectory || []), ...(coreDirectory || [])].map((entry) => entry.urn).filter(Boolean);
    if (upstream && !urns.includes(upstream)) {
      urns.unshift(upstream);
    }
    return Array.from(new Set(urns));
  }, [tenantDirectory, coreDirectory, upstream]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const targetId = id.trim();
    if (isNew) {
      if (!targetId) errs.id = 'Target ID is required';
      else if (!TOKEN_HANDLER_ID_PATTERN.test(targetId))
        errs.id = 'Target ID can only contain letters, numbers, hyphens and underscores';
      else if (targetId.length > TOKEN_HANDLER_ID_MAX_LENGTH)
        errs.id = `Target ID must be at most ${TOKEN_HANDLER_ID_MAX_LENGTH} characters`;
      else if (existingIds.includes(targetId)) errs.id = `A target with ID "${targetId}" already exists`;
    }
    if (!upstream.trim()) errs.upstream = 'Upstream URN is required';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      id: isNew ? id.trim() : target.id,
      upstream: upstream.trim(),
    });
  };

  return (
    <GoabModal
      heading={isNew ? 'Add target' : 'Edit target'}
      open={true}
      onClose={onClose}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton size="compact" type="secondary" onClick={onClose}>
            Cancel
          </GoabButton>
          <GoabButton size="compact" type="primary" onClick={handleSave}>
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem mb="s" label="Target ID" requirement="required" error={errors.id}>
        <GoabInput size="compact" width="100%"
          name="target-id"
          value={id}
          disabled={!isNew}
          onChange={(detail: GoabInputOnChangeDetail) => setId(detail.value)}
          testId="target-id-input"
        />
      </GoabFormItem>
      <GoabFormItem
        label="Upstream URN"
        requirement="required"
        error={errors.upstream}
      >
        <GoabDropdown
          size="compact"
          width="100%"
          name="target-upstream"
          placeholder="Select a service"
          value={upstream}
          filterable
          onChange={(detail: GoabDropdownOnChangeDetail) => setUpstream(detail.value)}
          testId="target-upstream-dropdown"
        >
          {upstreamOptions.map((urn) => (
            <GoabDropdownItem key={urn} value={urn} label={urn} />
          ))}
        </GoabDropdown>
      </GoabFormItem>
    </GoabModal>
  );
};

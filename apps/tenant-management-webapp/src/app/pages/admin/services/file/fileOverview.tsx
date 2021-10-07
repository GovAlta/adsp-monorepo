import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components';

import { RootState } from '@store/index';
import { EnableFileService } from '@store/file/actions';
import { UpdateTenantConfigService } from '@store/tenantConfig/actions';

const OverviewBtn = (): JSX.Element => {
  const dispatch = useDispatch();
  const tenantConfig = useSelector((state: RootState) => state.tenantConfig);
  const space = useSelector((state: RootState) => state.fileService.space);
  const isEnabled = tenantConfig.fileService.isEnabled;

  return (
    <GoAButton
      buttonType="primary"
      onClick={() => {
        // check there is space, if not create space
        // update tenant config
        if (!space || Object.keys(space).length === 0) {
          dispatch(EnableFileService());
        }
        const oldConfig = Object.assign({}, tenantConfig);
        const updatedConfig = {
          ...oldConfig,
          fileService: {
            isActive: !oldConfig.fileService.isActive,
            isEnabled: !oldConfig.fileService.isEnabled,
          },
        };

        dispatch(UpdateTenantConfigService(updatedConfig));
      }}
    >
      {isEnabled ? 'Disable Service' : 'Enable Service'}
    </GoAButton>
  );
};

const OverviewContent = (): JSX.Element => {
  return (
    <>
      <div>
        The file service provides the capability to upload and download files. Consumers are registered with their own
        space (tenant) containing file types that include role based access policy, and can associate files to domain
        records.
      </div>
      <h3>Service Management</h3>
      <div>
        File service management is a cross-cutting concern for multiple projects, tenant owner can enable/disable
        service, config files types ...
      </div>
    </>
  );
};

interface FileOverviewProps {
  isActive: boolean;
}

const FileOverview = (props: FileOverviewProps): JSX.Element => {
  return (
    <div>
      <OverviewContent />
      <br />
      <OverviewBtn />
    </div>
  );
};
export default FileOverview;

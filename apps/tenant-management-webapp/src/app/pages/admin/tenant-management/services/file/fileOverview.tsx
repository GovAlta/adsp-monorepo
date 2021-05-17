import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components';

import externalLinkIcon from '@assets/external-link.svg';
import { RootState } from '@store/index';
import { EnableFileService } from '@store/file/actions';
import { UpdateTenantConfigService } from '@store/tenantConfig/actions';
import { Aside, Main } from '@components/Html';

const OverviewBtn = () => {
  const dispatch = useDispatch();
  const tenantConfig = useSelector((state: RootState) => state.tenantConfig);
  const space = useSelector((state: RootState) => state.fileService.space);
  const isEnabled = tenantConfig.fileService.isEnabled;

  return (
    <GoAButton
      buttonType={isEnabled ? 'secondary' : 'primary'}
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

const HelpLink = () => {
  return (
    <div className="file-header-div">
      <span className="file-link-title">Helpful Links</span>
      <br />
      <a href="#">File Services Support</a>
      <img src={externalLinkIcon} className="external-link" alt="file-service-support" />
    </div>
  );
};

const OverviewContent = () => {
  return (
    <>
      <Main>
        <p>
          The file service provides the capability to upload and download files. Consumers are registered with their own
          space (tenant) containing file types that include role based access policy, and can associate files to domain
          records.
          <h3>Service Management</h3>
          File service management is a cross-cutting concern for multiple projects, tenant owner can enable/disable
          service, config files types ...
        </p>
      </Main>
      <Aside>
        <HelpLink />
      </Aside>
    </>
  );
};

interface FileOverviewProps {
  isActive: boolean;
  isEnabled: boolean;
}

const FileOverview = (props: FileOverviewProps) => {
  const roles = useSelector((state: RootState) => state.session.realmAccess.roles);
  const accessible = roles.includes('file-service-admin');
  return (
    <div>
      <OverviewContent />

      {accessible
        ? `This service is ${props.isActive ? 'active' : 'inactive'}   `
        : "You don't have permission to access this service"}
      <OverviewBtn />
      {/* {accessible && !props.isEnabled && <OverviewBtn />} */}
    </div>
  );
};
export default FileOverview;

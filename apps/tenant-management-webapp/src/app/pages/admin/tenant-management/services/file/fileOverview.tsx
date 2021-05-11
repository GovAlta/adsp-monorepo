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

  return (
    <GoAButton
      onClick={() => {
        // check there is space, if not create space
        // update tenant config
        if (Object.keys(space).length === 0) {
          dispatch(EnableFileService());
        }
        const updateConfig = Object.assign({}, tenantConfig);
        updateConfig.fileService.isActive = true;
        updateConfig.fileService.isEnabled = true;
        dispatch(UpdateTenantConfigService(updateConfig));
      }}
    >
      Enable Service
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
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent volutpat odio est, eget faucibus nisl
          accumsan eu. Ut sit amet elit non elit semper varius. Integer nunc felis, tristique at congue ac, efficitur
          sed ante. Phasellus mi nibh, tempus in ultrices id, lacinia sit amet nisi. Vestibulum dictum dignissim nibh a
          accumsan. Vestibulum eget egestas diam. Fusce est massa, venenatis a condimentum sed, elementum vel diam.
        </p>
      </Main>
      <Aside>
        <HelpLink />
      </Aside>
    </>
  );
};
const FileOverview = (props: any) => {
  const roles = useSelector((state: RootState) => state.session.realmAccess.roles);
  const accessible = roles.includes('file-service-admin');
  return (
    <div>
      <OverviewContent />

      {accessible
        ? `This service is ${props.isActive ? 'active' : 'inactive'}   `
        : "You don't have permission to access this service"}
      {accessible && !props.isEnabled && <OverviewBtn />}
    </div>
  );
};
export default FileOverview;

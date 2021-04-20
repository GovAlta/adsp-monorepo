import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components';

import externalLinkIcon from '@assets/external-link.svg';
import { RootState } from '@store/index';
import { EnableFileService } from '@store/file/actions';
import { Aside, Main } from '@components/Html';

const OverviewBtn = () => {
  const dispatch = useDispatch();

  return (
    <GoAButton
      onClick={() => {
        dispatch(EnableFileService());
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
export default function FileOverview() {
  const active = useSelector((state: RootState) => state.file.status.isActive);
  const roles = useSelector((state: RootState) => state.session.realmAccess.roles);
  const accessible = roles.includes('file-service-admin');

  return (
    <div>
      <OverviewContent />
      {accessible
        ? `This service is ${active ? 'active' : 'inactive'}`
        : "You don't have permission to access this service"}
      {accessible && !active && <OverviewBtn />}
    </div>
  );
}

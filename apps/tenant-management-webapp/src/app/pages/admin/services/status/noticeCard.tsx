import React, { useEffect, useState } from 'react';
import { Notice } from '@store/notice/models';
import styled from 'styled-components';
import { GoABadge } from '@abgov/react-components';
import SettingIcon from '@assets/icons/setting-filled.svg';
import { DraftDropdownMenu, PublishedDropdownMenu } from './noticeCardMenu';
import { fetchServiceStatusApps } from '@store/status/actions';
import { IconContext } from '@components/icons/IconContext';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';

const NoticeCardContainer = styled.div`
  border-radius: 0.25rem;
  border: 1px solid var(--color-gray-400);
  padding: 1rem;
  position: relative;
  height: 100%;
`;
const HeaderContainer = styled.div`
  padding-bottom: 0.5rem;
  img {
    float: right;
  }
`;
const CardContent = styled.div`
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
`;

const MessageContainer = styled.div`
  height: 5rem;
  margin-bottom: 1.5rem;
`;

const ServiceHref = styled.div`
  font-weight: var(--fw-bold);
  margin-bottom: 0.5rem;
`;

interface CardHeaderProps {
  mode: string;
}

interface NoticeCardProps {
  notice: Notice;
}

export const NoticeCard = (props: NoticeCardProps): JSX.Element => {
  const dispatch = useDispatch();
  const { applications } = useSelector((state: RootState) => ({
    applications: state.serviceStatus.applications,
  }));

  useEffect(() => {
    dispatch(fetchServiceStatusApps());
  }, []);

  const { notice } = props;
  const [openMenu, setOpenMenu] = useState(false);
  const CardHeader = (props: CardHeaderProps): JSX.Element => {
    return (
      <HeaderContainer>
        <IconContext>
          {props.mode === 'draft' && <GoABadge key={`${notice.id}-badge-draft`} content={'Draft'} type="information" />}
          {props.mode === 'active' && (
            <GoABadge key={`${notice.id}-badge-published`} content={'Published'} type="success" />
          )}
          {props.mode === 'archived' && (
            <GoABadge key={`${notice.id}-badge-archived`} content={'Archived'} type="midtone" />
          )}
          <img
            className="goa-icon"
            src={SettingIcon}
            width="30"
            alt="notice-card-setting"
            onClick={() => {
              setOpenMenu(!openMenu);
            }}
          />
        </IconContext>
      </HeaderContainer>
    );
  };

  const FormatNoticeDate = (date: Date): string => {
    const options = {
      timeZone: 'Canada/Mountain',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    const timeParts = new Date().toLocaleString('en-US', options).split(',');
    const localTime = `${timeParts[0]}, ${timeParts[1]} @ ${timeParts[2].toLowerCase()}`;

    return localTime;
  };

  const closeDropdownFn = (): void => {
    setOpenMenu(false)
  }

  return (
    <NoticeCardContainer key={`notice-card-container-${notice.id}`}>
      <CardHeader
        mode={notice.mode}
        key={`notice-card-header-${notice.id}`}
        data-testid="notice-card-header" />
      <CardContent
        key={`notice-content-${notice.id}`}
        data-testid="notice-card-content">
        <MessageContainer key={`notice-card-message-${notice.id}`} data-testid={`notice-card-message`}>
          {notice.message}
        </MessageContainer>
        <br />
        {notice.tennantServRef &&
          JSON.parse(notice.tennantServRef).map((application) => {
            const currentApplication = applications.find((app) => application.id === app._id);

            return (
              <ServiceHref key={`notice-service-Href-${notice.id}-${application.id}`}>
                {currentApplication?.name}
              </ServiceHref>
            );
          })}
        {openMenu && notice.mode === 'draft' && (
          <DraftDropdownMenu
            notice={notice}
            id={`${notice.id}`}
            data-testid="notice-card-draft-menu"
            closeActionFn={closeDropdownFn} />
        )}
        {openMenu && notice.mode === 'active' && (
          <PublishedDropdownMenu
            notice={notice} id={`${notice.id}`}
            data-testid="notice-card-published-menu"
            closeActionFn={closeDropdownFn} />
        )}
      </CardContent>
      <div>Start Date: {FormatNoticeDate(notice.startDate)}</div>
      <div>End Date: {FormatNoticeDate(notice.endDate)}</div>
    </NoticeCardContainer>
  );
};

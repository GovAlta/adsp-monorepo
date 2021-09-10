import React, { useEffect } from 'react';
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
  span.time-title {
    font-weight: var(--fw-bold);
    font-size: var(--fs-sm);
    display: inline-box;
    width: 4.5rem;
  }
  span.time {
    font-size: var(--fs-sm);
  }
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
   margin-bottom: 1rem;
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
  isMenuOpen: boolean;
  clickMenuFn: (id: string, isMenuAction?: boolean) => void;
}

export const NoticeCard = (props: NoticeCardProps): JSX.Element => {
  const dispatch = useDispatch();
  const { applications } = useSelector((state: RootState) => ({
    applications: state.serviceStatus.applications,
  }));
  const { isMenuOpen, clickMenuFn } = props;

  useEffect(() => {
    dispatch(fetchServiceStatusApps());
  }, []);

  const { notice } = props;
  const CardHeader = (props: CardHeaderProps): JSX.Element => {
    return (
      <HeaderContainer>
        <IconContext>
          {props.mode === 'draft' && <GoABadge
            key={`${notice.id}-badge-draft`}
            data-testid='notice-card-mode'
            content={'Draft'}
            type='information'
            testId='notice-card-mode'
          />}
          {props.mode === 'active' && (
            <GoABadge
              key={`${notice.id}-badge-published`}
              content={'Published'}
              data-testid='notice-card-mode'
              type="success"
              testId='notice-card-mode'
            />
          )}
          {props.mode === 'archived' && (
            <GoABadge key={`${notice.id}-badge-archived`}
              content={'Archived'}
              data-testid='notice-card-mode'
              testId='notice-card-mode'
              type="midtone" />
          )}
          {props.mode !== 'archived' && <img
            className="goa-icon"
            src={SettingIcon}
            width="30"
            alt="notice-card-setting"
            data-testid='notice-card-gear-button'
            onClick={() => {
              clickMenuFn(notice.id, false)
            }}
          />}
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
      year: 'numeric'
    };
    const timeParts = new Date(date).toLocaleString('en-US', options).split(',');
    const localTime = `${timeParts[0]}, ${timeParts[1]}, ${timeParts[2]} at ${timeParts[3].toLowerCase()}`;
    return localTime;
  };

  return (
    <NoticeCardContainer key={`notice-card-container-${notice.id}`}>
      {isMenuOpen && <div className='dropdown-overlay' onClick={() => { clickMenuFn(notice.id, true) }} />}
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
        {notice.tennantServRef &&
          JSON.parse(notice.tennantServRef).map((application) => {
            const currentApplication = applications.find((app) => application.id === app._id);

            return (
              <ServiceHref
                data-testid='notice-card-application'
                key={`notice-service-Href-${notice.id}-${application.id}`}>
                {currentApplication?.name}
              </ServiceHref>
            );
          })}
        {isMenuOpen && notice.mode === 'draft' && (
          <DraftDropdownMenu
            notice={notice}
            id={`${notice.id}`}
            data-testid="notice-card-draft-menu"
            closeActionFn={() => { clickMenuFn(notice.id, true) }} />
        )}
        {isMenuOpen && notice.mode === 'active' && (
          <PublishedDropdownMenu
            notice={notice} id={`${notice.id}`}
            data-testid="notice-card-published-menu"
            closeActionFn={() => { clickMenuFn(notice.id, true) }} />
        )}
      </CardContent>
      <div data-testid='notice-card-start-date'>
        <span className='time-title'>Start Date: </span>
        <span className='time'>{FormatNoticeDate(notice.startDate)}</span>
      </div>
      <div data-testid='notice-card-end-date'>
        <span className='time-title'>End Date: </span>
        <span className='time'>{FormatNoticeDate(notice.endDate)}</span>
      </div>
    </NoticeCardContainer>
  );
};

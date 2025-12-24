import React, { useEffect, useState } from 'react';
import { Notice } from '@store/notice/models';
import styled from 'styled-components';
import { GoabBadge } from '@abgov/react-components';
import { DraftDropdownMenu, PublishedDropdownMenu } from './noticeCardMenu';
import { IconContext } from '@components/icons/IconContext';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { deleteNotice } from '@store/notice/actions';
import { useDispatch } from 'react-redux';
import { DeleteModal } from '@components/DeleteModal';
import { FormatTimeWithDateAt } from '@lib/timeUtil';
import { GoAContextMenuIcon } from '@components/ContextMenu';

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
`;

const Settings = styled.div`
  float: right;
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

const OrphanedBadge = styled.span`
  margin-left: 0.2rem;
`;

interface CardHeaderProps {
  mode: string;
  isOrphaned: boolean;
}

interface NoticeCardProps {
  notice: Notice;
  isMenuOpen: boolean;
  clickMenuFn: (id: string, isMenuAction?: boolean) => void;
  openEditModalFn?: () => void;
  isOrphaned?: boolean;
}

export const NoticeCard = (props: NoticeCardProps): JSX.Element => {
  const dispatch = useDispatch();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const { applications } = useSelector((state: RootState) => ({
    applications: state.serviceStatus.applications,
  }));
  const { isMenuOpen, clickMenuFn } = props;
  // eslint-disable-next-line
  useEffect(() => {}, [applications]);

  const { notice } = props;
  const CardHeader = (props: CardHeaderProps): JSX.Element => {
    return (
      <HeaderContainer>
        <IconContext>
          {props.mode === 'draft' && (
            <GoabBadge
              key={`${notice.id}-badge-draft`}
              data-testid="notice-card-mode"
              content={'Draft'}
              type="information"
              testId="notice-card-mode"
              icon={false}
            />
          )}
          {props.mode === 'published' && (
            <GoabBadge
              key={`${notice.id}-badge-published`}
              content={'Published'}
              data-testid="notice-card-mode"
              type="success"
              testId="notice-card-mode"
              icon={false}
            />
          )}
          {props.mode === 'archived' && (
            <GoabBadge
              key={`${notice.id}-badge-archived`}
              content={'Archived'}
              data-testid="notice-card-mode"
              testId="notice-card-mode"
              type="midtone"
              icon={false}
            />
          )}
          {props.mode !== 'archived' && (
            <Settings>
              <GoAContextMenuIcon
                testId="notice-card-gear-button"
                title="Settings"
                type="settings"
                onClick={() => clickMenuFn(notice.id, false)}
              />
            </Settings>
          )}
          {props.isOrphaned && (
            <OrphanedBadge>
              <GoabBadge
                key={`${notice.id}-orphaned`}
                content={'Orphaned'}
                data-testid="notice-card-orphaned"
                type="information"
                icon={false}
              />
            </OrphanedBadge>
          )}
        </IconContext>
      </HeaderContainer>
    );
  };

  return (
    <div>
      <NoticeCardContainer key={`notice-card-container-${notice.id}`}>
        {isMenuOpen && (
          <div
            className="dropdown-overlay"
            data-testid="dropdown-overlay"
            onClick={() => {
              clickMenuFn(notice.id, true);
            }}
          />
        )}
        <CardHeader
          mode={notice.mode}
          isOrphaned={props.isOrphaned}
          key={`notice-card-header-${notice.id}`}
          data-testid="notice-card-header"
        />
        <CardContent
          key={`notice-content-${notice.id}`}
          onClick={() => {
            clickMenuFn(notice.id, true);
          }}
          data-testid="notice-card-content"
        >
          <MessageContainer key={`notice-card-message-${notice.id}`} data-testid={`notice-card-message`}>
            {notice.message}
          </MessageContainer>
          {notice.isAllApplications && (
            <ServiceHref data-testid="notice-card-application" key={`notice-service-Href-${notice.id}`}>
              All applications
            </ServiceHref>
          )}
          {notice.tennantServRef &&
            notice.isAllApplications === false &&
            notice.tennantServRef.map((application) => {
              const currentApplication = applications.find((app) => application?.id === app.appKey);
              return (
                <ServiceHref
                  data-testid="notice-card-application"
                  key={`notice-service-Href-${notice.id}-${application?.id}`}
                >
                  {currentApplication?.name}
                </ServiceHref>
              );
            })}
          {isMenuOpen && notice.mode === 'draft' && (
            <DraftDropdownMenu
              notice={notice}
              id={`${notice.id}`}
              data-testid="notice-card-draft-menu"
              closeActionFn={() => {
                clickMenuFn(notice.id, true);
              }}
              openEditModalFn={() => {
                props.openEditModalFn();
              }}
              deleteActionFn={() => setShowDeleteConfirmation(true)}
            />
          )}
          {isMenuOpen && notice.mode === 'published' && (
            <PublishedDropdownMenu
              notice={notice}
              id={`${notice.id}`}
              data-testid="notice-card-published-menu"
              closeActionFn={() => {
                clickMenuFn(notice.id, true);
              }}
            />
          )}
        </CardContent>
        <div data-testid="notice-card-start-date">
          <span className="time-title">Start date: </span>
          <span className="time">{FormatTimeWithDateAt(notice.startDate)}</span>
        </div>
        <div data-testid="notice-card-end-date">
          <span className="time-title">End date: </span>
          <span className="time">{FormatTimeWithDateAt(notice.endDate)}</span>
        </div>
      </NoticeCardContainer>
      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete notice"
        content={
          <div>
            Are you sure you wish to delete <b>{props.notice.message}</b>?
          </div>
        }
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(deleteNotice(props.notice.id));
        }}
      />
    </div>
  );
};

import React from 'react';
import styled from 'styled-components';
import { useLocation, useHistory } from 'react-router-dom';
import { Notice } from '@store/notice/models';
import { saveNotice, deleteNotice } from '@store/notice/actions';
import { useDispatch } from 'react-redux';

const DropdownMenuContainer = styled.div`
  width: 9rem;
  .item {
    padding-left: 1rem;
    height: 2.5rem;
    margin: auto;
    :hover {
      background: var(--color-gray-300);
    }
    padding-top: 0.5rem;
  }
  position: absolute;
  top: 3.5rem;
  right: 1rem;
  border-radius: 4px 4px 4px 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  background: white;
`;
interface DropdownMenuProps {
  id: string;
  notice: Notice;
  closeActionFn?: () => void;
}

export const DraftDropdownMenu = (props: DropdownMenuProps): JSX.Element => {
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();

  function redirect(route: string) {
    history.push(route);
  }

  function changeMode(mode) {
    const changedNotice = props.notice;
    changedNotice.mode = mode;
    dispatch(saveNotice(changedNotice));
    props.closeActionFn()
  }

  function delNotice() {
    dispatch(deleteNotice(props.notice.id));
    props.closeActionFn()
  }

  return (
    <DropdownMenuContainer>
      <div
        className="item"
        onClick={() => changeMode('active')}
        data-testid='notice-card-menu-publish'>
        Publish
      </div>
      <div className="item"
        onClick={() => {
          props.closeActionFn()
          redirect(`${location.pathname}/notice/${props.id}`)
        }}
        data-testid='notice-card-menu-edit'>
        Edit
      </div>
      <div className="item" onClick={() => delNotice()} data-testid='notice-card-menu-delete'>
        Delete
      </div>
    </DropdownMenuContainer>
  );
};

export const PublishedDropdownMenu = (props: DropdownMenuProps): JSX.Element => {
  const dispatch = useDispatch();

  function changeMode(mode) {
    const changedNotice = props.notice;
    changedNotice.mode = mode;
    dispatch(saveNotice(changedNotice));
    props.closeActionFn()
  }

  return (
    <DropdownMenuContainer>
      <div className="item"
        onClick={() => changeMode('draft')}
        data-testid='notice-card-menu-unpublish'>
        Unpublish
      </div>
      <div className="item"
        onClick={() => changeMode('archived')}
        data-testid='notice-card-menu-archive'>
        Archive
      </div>
    </DropdownMenuContainer>
  );
};

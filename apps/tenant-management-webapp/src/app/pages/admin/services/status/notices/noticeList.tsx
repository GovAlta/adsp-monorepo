import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Grid, GridItem } from '@core-services/app-common';
import { NoticeCard } from './noticeCard';
import FilterIcon from '@assets/icons/filter-filled.svg';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { GoARadioItem, GoARadioGroup } from '@abgov/react-components-new';
import { renderNoItem } from '@components/NoItem';
import NoticeModal from './noticeModal';
import { createSelector } from 'reselect';

type filterOptionOnSelect = (option: string) => void;

interface NoticeListFilterProps {
  onSelect: filterOptionOnSelect;
  option: string;
}

const NoticeListContainer = styled.div`
  margin-bottom: 1rem;
`;

const NoticeListFilterContainer = styled.div`
  float: left;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  .filter-header {
    padding: 1rem 2rem 1rem 0;
    font-size: var(--fs-base);
    text-align: left;
    display: flex;
  }
  display: flex;
  padding-bottom: 1rem;
  flex-wrap: wrap;
`;

export const selectStatusIdentifiers = createSelector(
  (state: RootState) => state.serviceStatus?.applications || [],
  (applications) => {
    return applications.map((app) => {
      return `${app.appKey}:${app.name}`;
    });
  }
);

export const NoticeListFilter = (props: NoticeListFilterProps): JSX.Element => {
  const { option, onSelect } = props;
  return (
    <NoticeListFilterContainer>
      <div className="filter-header">
        <img src={FilterIcon} width="20" alt="notice-filter" />
        <span>Filter by status</span>
      </div>
      <GoARadioGroup
        name="option"
        value={option}
        onChange={(_, value: string) => onSelect(value)}
        orientation="horizontal"
      >
        <GoARadioItem value="active" label="Active" name="active" />
        <GoARadioItem value="draft" label="Draft" name="draft" />
        <GoARadioItem value="published" label="Published" name="published" />
        <GoARadioItem value="archived" label="Archived" name="archived" />
      </GoARadioGroup>
    </NoticeListFilterContainer>
  );
};

export const NoticeList = (): JSX.Element => {
  const [filerOption, setFilterOption] = useState('active');
  const [showEditModalId, setShowEditModalId] = useState<string>(null);

  const { notices } = useSelector((state: RootState) => ({
    notices: state.notice?.notices,
  }));

  const applicationIdentifiers = useSelector(selectStatusIdentifiers);
  const [openMenuId, setOpenMenuId] = useState<string>(null);

  const filterOnSelectFn = (option: string) => {
    setFilterOption(option);
  };

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [notices]);

  const clickCardMenuFn = (id: string, isMenuAction): void => {
    if (isMenuAction) {
      setOpenMenuId(null);
    } else {
      if (openMenuId && openMenuId === id) {
        setOpenMenuId(null);
      } else {
        setOpenMenuId(id);
      }
    }
  };

  let count = 0;

  return (
    <NoticeListContainer data-testid="notice-list">
      {openMenuId !== null && (
        <div
          className="dropdown-overlay"
          onClick={() => {
            setOpenMenuId(null);
          }}
        />
      )}

      <NoticeModal
        isOpen={showEditModalId !== null}
        title="Edit notice"
        onCancel={() => {
          setShowEditModalId(null);
        }}
        onSave={() => {
          setShowEditModalId(null);
        }}
        noticeId={showEditModalId}
      />

      <Grid>
        <GridItem md={12} hSpacing={0.5}>
          {notices && notices?.length === 0 && renderNoItem('notice')}
          {notices && notices?.length !== 0 && (
            <NoticeListFilter
              data-testid="notice-list-filter"
              option={filerOption}
              onSelect={(value) => {
                filterOnSelectFn(value);
              }}
            />
          )}
        </GridItem>

        {notices &&
          notices
            .filter((notice) => {
              if (filerOption === 'active') {
                return notice.mode !== 'archived';
              } else {
                if (notice.mode === filerOption) {
                  count++;
                }
                return notice.mode === filerOption;
              }
            })
            .map((notice) => (
              <GridItem md={12} key={notice.id} vSpacing={0.75}>
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  data-testid="notice-card"
                  clickMenuFn={clickCardMenuFn}
                  openEditModalFn={() => {
                    setShowEditModalId(notice.id);
                  }}
                  isMenuOpen={openMenuId === notice.id}
                  isOrphaned={
                    notice?.tennantServRef &&
                    notice?.tennantServRef.length > 0 &&
                    !applicationIdentifiers.includes(
                      `${notice?.tennantServRef[0]['id']}:${notice?.tennantServRef[0]['name']}`
                    )
                  }
                />
              </GridItem>
            ))}
      </Grid>
      {count === 0 && filerOption !== 'active' && notices.length > 0 && renderNoItem('notice')}
    </NoticeListContainer>
  );
};

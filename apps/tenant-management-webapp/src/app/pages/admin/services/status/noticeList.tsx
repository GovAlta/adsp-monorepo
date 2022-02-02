import React, { useState } from 'react';
import styled from 'styled-components';
import { Grid, GridItem } from '@components/Grid';
import { NoticeCard } from './noticeCard';
import FilterIcon from '@assets/icons/filter-filled.svg';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { GoARadio } from '@abgov/react-components';
import { renderNoItem } from '@components/NoItem';

type filterOptionOnSelect = (option: string) => void;

interface NoticeListFilterProps {
  onSelect: filterOptionOnSelect;
  option: string;
}

const NoticeListContainer = styled.div`
  margin-bottom: 1rem;
`;

const NoticeListFilterContainer = styled.div`
  float: right;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  .filter-header {
    padding-right: 1rem;
    font-size: var(--fs-base);
    text-align: center;
    display: flex;
    margin: auto;
  }
  .filter-radio {
    display: inline-flex;
    .goa-radio-label {
      padding-bottom: 0rem !important;
      padding-top: 0rem !important;
    }
  }
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
`;

export const NoticeListFilter = (props: NoticeListFilterProps): JSX.Element => {
  const { option, onSelect } = props;
  return (
    <NoticeListFilterContainer>
      <div className="filter-header">
        <img src={FilterIcon} width="20" alt="notice-filter" />
        <span>Filter by status</span>
      </div>
      <div className="filter-radio">
        <GoARadio
          value={'all'}
          testId={'notice-filter-radio-draft'}
          checked={option === 'all'}
          onChange={(option) => {
            onSelect(option);
          }}
        >
          All
        </GoARadio>
      </div>
      <div className="filter-radio">
        <GoARadio
          testId="notice-filter-radio-draft"
          value={'draft'}
          checked={option === 'draft'}
          onChange={(option) => {
            onSelect(option);
          }}
        >
          Draft
        </GoARadio>
      </div>
      <div className="filter-radio">
        <GoARadio
          testId="notice-filter-radio-published"
          value={'active'}
          name={'Published'}
          checked={option === 'active'}
          onChange={(option) => {
            onSelect(option);
          }}
        >
          Published
        </GoARadio>
      </div>
      <div className="filter-radio">
        <GoARadio
          testId="notice-filter-radio-archived"
          value={'archived'}
          name={'Archived'}
          checked={option === 'archived'}
          onChange={(option) => {
            onSelect(option);
          }}
        >
          Archived
        </GoARadio>
      </div>
    </NoticeListFilterContainer>
  );
};

export const NoticeList = (): JSX.Element => {
  const [filerOption, setFilterOption] = useState('all');
  const { notices } = useSelector((state: RootState) => ({
    notices: state.notice?.notices,
  }));
  const [openMenuId, setOpenMenuId] = useState<string>(null);

  const filterOnSelectFn = (option: string) => {
    setFilterOption(option);
  };

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
      <Grid>
        <GridItem md={12} hSpacing={0.5}>
          {notices.length === 0 && renderNoItem('notice')}
          {notices && notices.length !== 0 && (
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
              if (filerOption === 'all') {
                return true;
              } else {
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
                  isMenuOpen={openMenuId === notice.id}
                />
              </GridItem>
            ))}
      </Grid>
    </NoticeListContainer>
  );
};

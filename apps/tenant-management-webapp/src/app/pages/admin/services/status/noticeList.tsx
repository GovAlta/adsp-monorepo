import React, { useState } from 'react';
import styled from 'styled-components';
import { Grid, GridItem } from '@components/Grid';
import { NoticeCard } from './noticeCard';
import FilterIcon from '@assets/icons/filter-filled.svg';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

type filterOptionOnSelect = (option: string) => void;

interface NoticeListFilterProps {
  onSelect: filterOptionOnSelect;
  option: string;
}

const NoticeListContainer = styled.div``;

/* TODO: replace with GoA Radio when it is ready*/
interface RadioProps {
  label: string;
  value: string;
  checked: boolean;
  onSelect?: filterOptionOnSelect;
}

const Radio = (props: RadioProps): JSX.Element => {
  const { label, value, checked, onSelect } = props;
  return (
    <>
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={(e) => {
          onSelect(e.target.value);
        }}
      />{' '}
      {label}
    </>
  );
};

const NoticeListFilterContainer = styled.div`
  float: right;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
  .filter-header {
    padding-right: 1rem;
    display: inline-block;
  }
  .filter-radio {
    padding-right: 0.5rem;
    display: inline-block;
  }
`;

export const NoticeListFilter = (props: NoticeListFilterProps): JSX.Element => {
  const { option, onSelect } = props;
  return (
    <NoticeListFilterContainer>
      <div className='filter-header'>
        <img src={FilterIcon} width="14" alt="notice-filter" /> Filter by status
      </div>
      <div className='filter-radio'>
        <Radio
          data-testid="notice-filter-radio-all"
          value={'all'}
          label={'All'}
          checked={option === 'all'}
          onSelect={onSelect}
        />
      </div>
      <div className='filter-radio'>
        <Radio
          data-testid="notice-filter-radio-draft"
          value={'draft'}
          label={'Draft'}
          checked={option === 'draft'}
          onSelect={onSelect}
        />
      </div>
      <div className='filter-radio'>
        <Radio
          data-testid="notice-filter-radio-published"
          value={'active'}
          label={'Published'}
          checked={option === 'active'}
          onSelect={onSelect}
        />
      </div>
      <div className='filter-radio'>
        <Radio
          data-testid="notice-filter-radio-archived"
          value={'archived'}
          label={'Archived'}
          checked={option === 'archived'}
          onSelect={onSelect}
        />
      </div>
    </NoticeListFilterContainer>
  );
};

export const NoticeList = (): JSX.Element => {
  const [filerOption, setFilterOption] = useState('all');
  const { notices } = useSelector((state: RootState) => ({
    notices: state.notice?.notices,
  }));

  const filterOnSelectFn = (option: string) => {
    setFilterOption(option);
  };

  return (
    <NoticeListContainer data-testid="notice-list">
      <Grid>
        <GridItem md={12} hSpacing={0.5}>
          {notices && (
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
              <GridItem md={6} vSpacing={1} hSpacing={0.5} key={notice.id}>
                <NoticeCard key={notice.id} notice={notice} data-testid="notice-card" />
              </GridItem>
            ))}
      </Grid>
    </NoticeListContainer>
  );
};

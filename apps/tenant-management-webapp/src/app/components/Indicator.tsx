import React, { useEffect } from 'react';
import styled from 'styled-components';
import { GoAPageLoader } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

const ActionIndicatorContainer = styled.div`
  position: fixed;
  top: 40%;
`
interface ActionIndicatorProps {
  message?: string;
}

export const ActionIndicator = (props: ActionIndicatorProps): JSX.Element => {
  const { indicator } = useSelector((state: RootState) => ({
    indicator: state.session?.indicator,
  }));

  // eslint-disable-next-line
  useEffect(() => { }, [indicator?.show])

  return (
    <ActionIndicatorContainer>
      <GoAPageLoader visible={indicator?.show} type="infinite" />
    </ActionIndicatorContainer>
  )
}
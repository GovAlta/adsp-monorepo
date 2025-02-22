import React from 'react';
import { GoASkeleton } from '@abgov/react-components';

interface TextSkeletonProps {
  lineCount?: number;
}
export const TextGoASkeleton = (props: TextSkeletonProps): JSX.Element => {
  const lineCount = props.lineCount || 1;

  const skeletonLines = [];
  for (let i = 0; i < lineCount; i++) {
    skeletonLines.push(<GoASkeleton key={i} type="text" />);
  }

  return <div>{skeletonLines}</div>;
};

import React, { useContext, useEffect } from 'react';
import { ControlProps } from '@jsonforms/core';

interface BaseReviewOptions {
  reviewOptions?: object;
  reviewString?: string;
}

export type BaseReviewWrapperProps = ControlProps & BaseReviewOptions;
export const basePreviewWrapper = (props: BaseReviewWrapperProps): JSX.Element => {
  return (
    <div>
      <label>{props.label}</label>
      <>{props?.reviewString}</>
    </div>
  );
};

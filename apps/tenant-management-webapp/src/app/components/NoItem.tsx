import React from 'react';
export const renderNoItem = (itemName: string): JSX.Element => {
  return (
    <div>
      <br />
      <p>
        <br />
        <b>{`No ${itemName} found`}</b>
      </p>
    </div>
  );
};

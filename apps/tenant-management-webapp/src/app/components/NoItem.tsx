import React from 'react';
export const renderNoItem = (itemName: string, isTight = false): JSX.Element => {
  return (
    <div>
      {!isTight && <br />}
      <p>
        {!isTight && <br />}
        <b>{`No ${itemName} found`}</b>
      </p>
    </div>
  );
};

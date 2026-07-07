import React from 'react';
import { Link } from 'react-router-dom';

interface DefaultServiceListTemplateProps {
  prefix?: string;
  tenantName?: string;
}

const ITEM_COUNT = 5;

export const DefaultServiceListTemplate = ({ prefix, tenantName }: DefaultServiceListTemplateProps) => {
  const listPrefix = prefix ?? 'Item ';

  return (
    <ul>
      {Array.from({ length: ITEM_COUNT }).map((_, y) => {
        return (
          <li id={`listItem_${y}`}>
            <Link to={`#`}>
              {listPrefix} {y + 1}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

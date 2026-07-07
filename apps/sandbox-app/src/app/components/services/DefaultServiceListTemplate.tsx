import React from 'react';
import { Link } from 'react-router-dom';

interface DefaultServiceListTemplateProps {
  prefix?: string;
}

const ITEM_COUNT = 5;
export const DefaultServiceListTemplate = ({ prefix }: DefaultServiceListTemplateProps) => {
  const listPrefix = prefix ?? 'Item ';

  return (
    <ul>
      {Array.from({ length: ITEM_COUNT }).map((_, y) => {
        return (
          <li>
            <Link to={'#'}>
              {listPrefix} {y + 1}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

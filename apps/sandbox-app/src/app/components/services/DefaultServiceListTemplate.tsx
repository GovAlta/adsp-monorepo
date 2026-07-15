import React from 'react';
import { Link } from 'react-router-dom';

interface DefaultServiceListTemplateProps {
  prefix?: string;
  tenantName?: string;
}

const ITEM_COUNT = 2;

/**
 * Use this component to render a dummy list of examples for the service if no specific
 * example(s) has been created yet.
 */
export const DefaultServiceListTemplate = ({ prefix, tenantName }: DefaultServiceListTemplateProps) => {
  const listPrefix = prefix ?? 'Item ';

  return (
    <ul>
      {Array.from({ length: ITEM_COUNT }).map((_, y) => {
        return (
          <li id={`listItem_${y}`} key={`listItem_${y}`}>
            <Link to={`#`}>
              {listPrefix} {y + 1}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

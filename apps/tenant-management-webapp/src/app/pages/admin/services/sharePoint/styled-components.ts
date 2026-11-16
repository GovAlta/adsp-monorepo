import styled, { css } from 'styled-components';

// goa-tooltip is inline and inherits the text line height, which drops its icon below the label's centre.
const centredInfoIcon = css`
  goa-tooltip {
    display: inline-flex;
    align-items: center;
    line-height: 0;
  }
`;

export const IdField = styled.div`
  min-height: 1.6rem;
`;

export const TableDiv = styled.div`
  word-wrap: break-word;
  table-layout: fixed;
  & th:nth-child(3) {
    min-width: 160px;
  }

  & td:nth-child(3) {
    min-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow-wrap: anywhere;
  }

  & .meta {
    padding: 0;
  }
`;

export const ButtonPadding = styled.div`
  padding-bottom: var(--goa-space-l);
  padding-top: var(--goa-space-l);
`;

export const MoreDetails = styled.div`
  background-color: var(--goa-color-greyscale-100);
  padding: var(--goa-space-s) var(--goa-space-l) var(--goa-space-l) var(--goa-space-l);
  width: 100%;
  text-align: left;
  p {
    font-weight: bold;
    padding-top: var(--goa-space-s);
    margin-bottom: var(--goa-space-xs);
  }
  span {
    white-space: normal;
  }
`;

export const ConnectionPadding = styled.div`
  padding: 0 0 var(--goa-space-l) 0;
`;

export const MarginTop = styled.div`
  margin-top: var(--goa-space-m);
`;

// Centring the icon box sits it above the bold label's visible text, so the label row nudges it down.
export const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-2xs);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-2xs);
  ${centredInfoIcon}

  goa-tooltip {
    transform: translateY(0.125rem);
  }
`;

export const TabIntro = styled.p`
  margin-top: var(--goa-space-m);
  max-width: 50rem;
`;

export const SiteIdParts = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--goa-space-3xs) var(--goa-space-s);
  margin: var(--goa-space-xs) 0 0 0;
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-text-secondary);
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;

export const MappingGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: var(--goa-space-s) var(--goa-space-m);
  align-items: center;
  margin-bottom: var(--goa-space-s);
`;

export const MappingHeading = styled.span`
  font-size: var(--goa-font-size-2);
  font-weight: var(--goa-font-weight-bold);
  color: var(--goa-color-text-secondary);
`;

export const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-2xs);
  ${centredInfoIcon}

  goa-checkbox {
    flex: 0 0 auto;
  }
`;

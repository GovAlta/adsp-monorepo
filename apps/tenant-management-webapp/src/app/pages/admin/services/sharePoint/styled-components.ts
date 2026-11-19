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
// Nudge with top rather than transform: a transform traps the tooltip bubble under the next input.
export const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-2xs);
  font-weight: var(--goa-font-weight-bold);
  margin-bottom: var(--goa-space-2xs);
  ${centredInfoIcon}

  goa-tooltip {
    position: relative;
    top: 0.125rem;
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.8fr) auto;
  gap: var(--goa-space-s) var(--goa-space-m);
  align-items: center;
  margin-bottom: var(--goa-space-s);
`;

export const DetailListBox = styled.div`
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  padding: var(--goa-space-m);
  margin-bottom: var(--goa-space-m);
`;

export const FieldPair = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--goa-space-m);
  margin-bottom: var(--goa-space-l);
`;

export const DetailListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--goa-space-s);
  font-weight: var(--goa-font-weight-bold);
`;

export const VerifyList = styled.section`
  margin-bottom: var(--goa-space-l);

  h3 {
    margin: 0 0 var(--goa-space-xs) 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    text-align: left;
    padding: var(--goa-space-2xs) var(--goa-space-xs);
    border-bottom: 1px solid var(--goa-color-greyscale-200);
    vertical-align: top;
  }
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

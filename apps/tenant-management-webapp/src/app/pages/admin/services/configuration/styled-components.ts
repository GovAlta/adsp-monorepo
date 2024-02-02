import styled from 'styled-components';

// configuration
export const NameDiv = styled.div`
  margin-top: 1rem;
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  padding-left: 0.4rem;
  padding-bottom: 0.5rem;
`;

// definitionsList
export const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 12px;
  padding: 16px;
  text-align: left;
`;

export const TableDiv = styled.div`
  & td:first-child {
    width: 120px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
  }
  & td:nth-child(2) {
    word-wrap: break-word;
    word-break: break-word;
  }

  & td:last-child {
    width: 40px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
    text-align: right;
  }
`;

export const Import = styled.div`
  .pb3 {
    padding-bottom: 1rem;
  }

  .choose-button {
    border-radius: 4px;
    background: #f1f1f1;
  }

  .row-flex {
    display: flex;
  }

  .margin-left {
    margin-left: 0.5rem;
    margin-top: 0.25rem;
  }
`;

export const IconDiv = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

export const NoItem = styled.div`
  text-align: center;
  padding-top: 1.5rem;
  padding-bottom: 0.5rem;
`;

export const StatusText = styled.div`
  display: flex;
  padding-top: 1rem;
`;

export const StatusIcon = styled.div`
  margin-right: 0.25rem;
  padding-top: 0.25rem;
`;
export const DescriptionDiv = styled.div`
  margin-left: 2rem;
  font-size: 16px;
`;
export const ErrorStatusText = styled.div`
  font-size: var(--fs-sm);
  line-height: calc(var(--fs-sm) + 0.5rem);
  color: var(--color-red);
  margin-top: 1rem;
`;

export const Exports = styled.div`
  .flex-row {
    display: flex;
    flex-direction: row;
  }

  h3 {
    overflow-wrap: anywhere;
  }

  .flex-reverse-row {
    display: flex;
    flex-direction: row-reverse;
  }

  .flex-one {
    flex: 1;
  }

  .goa-checkbox {
    align-items: start;
    margin-top: 10px;
    margin-bottom: -10px;
  }
  .button-style {
    text-align-last: end;
    font-size: 18px;
    margin: 29px 3px 0 3px;
  }

  .bubble-helper {
    margin-bottom: -11px;
    display: flex;
    flex-direction: column;
  }

  .triangle {
    margin-top: 5px;
    margin-bottom: -10px;
  }

  .info-circle-padding {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 5px;
  }

  .small-close-button {
    width: 10px;
    margin-left: auto;
    margin-top: -10px;
  }

  .triangle-width {
    width: 30px;
  }

  .auto-overflow {
    overflow: auto;
    overflow-x: hidden;
  }

  .full-width: {
    width: 100%;
  }

  .configuration-selector {
    width: 272px;
  }

  .absolute-position {
    position: absolute;
  }

  .ellipsis-wrapper {
    display: block;
    flex-wrap: wrap;
    overflow: hidden;
    overflow-wrap: anywhere;
  }

  .text {
    display: block !important;
    flex-wrap: wrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .chip {
    display: flex !important;
  }

  .header-margin {
    margin-top: 1rem !important;
    margin-bottom: 0.5rem !important;
  }

  .overflow-wrap {
    overflow-wrap: anywhere;
  }

  .bubble-border {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 10px 12px 8px 12px;
    margin-right: 10px;
    gap: 8px;

    width: 272px;
    height: 100%;
    left: 0px;
    top: 42px;

    background: #ffffff;
    box-shadow: 0px -1px 6px rgba(0, 0, 0, 0.25);
    border-radius: 4px;
  }

  .goa-checkbox-container: hover {
    border: 2px solid #004f84;
    background: white;
  }

  .goa-checkbox--selected: hover {
    background: #004f84;
    border: 1px solid !important;
  }
`;

export const ChipWrapper = styled.div`
  margin: 4px 0 4px 0;
`;

export const ConfigurationTableStyles = styled.div`
  .flex-horizontal {
    display: flex;
    flex-direction: row;
  }

  .flex {
    flex: 1;
  }

  .mt-1 {
    margin-top: 2px;
  }

  .mt-2 {
    margin-top: 4px;
  }
`;

export const RowFlex = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

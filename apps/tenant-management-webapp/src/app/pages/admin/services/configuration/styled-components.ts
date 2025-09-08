import styled from 'styled-components';

export const NotificationBannerWrapper = styled.div`
  top: 0;
  position: fixed;
  left: 0;
  right: 0;
`;

export const EditorLHSWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  // overflow-y: hidden;
`;

export const Tooltip = styled.div`
  position: relative;
  p {
    display: none;
    position: absolute;
  }
  &:hover p {
    display: block;
    margin: 0;
    padding: 3px 7px;
    background: #ffffff;
    border: 1px solid grey;
    bottom: -37px;
    width: max-content;
    min-width: 200px;
    font-size: 16px;
  }
`;

export const Anchor = styled.div`
  color: #0070c4;
  text-decoration: underline;
  outline: none;
  cursor: pointer;
  margin-right: 4px;
`;

export const Title = styled.div`
  font-size: var(--goa-font-size-7);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
  font-family: var(--goa-font-family-sans);
  margin-bottom: var(--goa-space-s);
}
`;

export const Edit = styled.div`
  .flexRow {
    display: flex;
    flex-direction: row;
  }

  .badgePadding {
    margin: 6px 0 0 5px;
  }

  goa-icon-button {
    position: relative;
    left: -0.25rem;
  }

  a {
    margin-top: 3px;
    margin-right: var(--goa-space-xs);
    text-decoration: underline;
    line-height: 28px;
  }
  display: flex;
  flex-direction: row;
  margin-right: var(--goa-space-m);
  margin-top: 0;
  padding-top: var(--goa-space-3xs);
`;

export const ConfigFormWrapper = styled.div`
  margin-top: var(--goa-space-m);
  font-size: var(--goa-fontSize-3);
  padding-left: 3px;
  border: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
  border-radius: 3px;
  height: 7.375rem;
  background-color: var(--goa-color-greyscale-100);
  padding-right: var(--goa-color-greyscale-100);

  display: flex;
  margin-bottom: var(--goa-space-l);
  .nameColumn {
    width: 91px;
    height: 85px;
    margin: var(--goa-space-m);
  }
  .idColumn {
    width: 105px;
    height: 118px;
    margin: var(--goa-space-m);
  }
  .descColumn {
    width: 606px;
    height: 118px;
    margin: var(--goa-space-m);
    p {
      bottom: -105px !important;
      max-width: 300px !important;
    }
  }
  .overflowContainer {
    height: 48px;
    overflow: hidden;
    vertical-align: top;
    width: 100%;
    -webkit-box-orient: vertical;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    font-size: 16px;
    font-weight: 400;
    font-family: 'acumin-pro-semi-condensed';
    line-height: 24px;
    word-wrap: break-word;
    word-break: break-word;
  }
  .editColumn {
    float: right;
    width: 53px;

    margin: var(--goa-space-m) var(--goa-space-m) var(--goa-space-m) auto;
  }
  .separator {
    margin-top: var(--goa-space-m);
    width: 1px;
    height: 5.375rem;

    border-left: var(--goa-border-width-s) solid #ccc;
  }
  .hideOverflow {
    overflow: hidden;
  }
  table {
  }
  th {
    white-space: nowrap;
    text-align: left;
    font-size: var(--goa-font-size-4);
    line-height: var(--goa-line-height-3);
    font-weight: var(--goa-font-weight-bold);
    font-family: var(--goa-font-family-sans);
  }
`;

export const OuterTemplateEditorContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

export const Modal = styled.div<{ isNotificationActive: boolean }>`
  display: block;
  position: fixed;
  left: 0;
  z-index: 10000;
  width: 100%;
  top: ${(props) => (props.isNotificationActive ? `93px` : `0px`)};
`;

export const ModalContent = styled.div`
  background: white;
`;

export const HideTablet = styled.div`
  @media (max-height: 629px) {
    display: none;
  }

  @media (max-width: 1439px) {
    display: none;
  }
`;

export const TemplateEditorContainer = styled.div`
  display: flex;
  flex: auto;
  margin-top: 0px;
  padding-left: var(--goa-space-xl);
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
`;

export const RightTemplateContainer = styled.div`
  width: calc(40vw + 3.9rem);
  margin-right: var(--goa-space-xl);
  margin-left: var(--goa-space-xl);
  overflow: hidden;
  padding-top: var(--goa-space-xs);
  &:hover {
    overflow: auto;
  }
`;

// configuration
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
  padding: 1rem 0;
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

import styled from 'styled-components';
import { PreviewPortal } from './templates/previewPortal';

export const FileTableStyles = styled.div`
  .flex-horizontal {
    display: flex;
    flex-direction: row;
  }

  .flex {
    flex: 1;
  }

  .display-flex {
    display: flex;
  }

  .flex-auto {
    flex: auto;
  }

  margin: var(--goa-spacing-xs) 0 var(--goa-spacing-m);

  .some-margin {
    margin: var(--goa-spacing-xs);
  }
  thead {
    margin-bottom: var(--goa-spacing-xs);
  }
`;

export const PopulateTemplateWrapper = styled.div`
  display: flex;
  margin-left: 3px;
  margin-top: 1.5rem;
`;

export const BadgeWrapper = styled.div`
  margin-left: var(--goa-spacing-m);
`;

export const ButtonBox = styled.div`
  width: 1.75rem;
`;

export const PaddingRight = styled.div`
  margin-right: 12px;
`;

export const ButtonRight = styled.div`
  margin-top: 8px;
  text-align: end;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: var(--goa-spacing-m);
`;
export const PDFTemplateEditorContainer = styled.div`
  display: flex;
  flex: auto;
  margin-top: 0px;
  padding-left: var(--goa-spacing-xl);
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
`;

export const OuterPDFTemplateEditorContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

export const TemplateEditorContainerPdf = styled.div`
  padding-right: var(--goa-spacing-m);
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
  width: calc(100vw - 40vw - 9.9rem);
  padding-top: var(--goa-spacing-xs);

  .reduce-margin {
    margin-top: 5px;
  }

  .scroll-bar {
    max-height: -webkit-fill-available;
    overflow-y: auto;
  }

  @media (min-width: 1279px) {
    .mobile {
      display: none;
    }
  }

  .goa-form-item {
    margin-bottom: 0rem !important;
  }

  .hr-resize {
    margin-top: var(--goa-spacing-s);
  }
  .hr-resize-bottom {
    margin-bottom: var(--goa-spacing-l);
  }
  .hr-resize-top {
    margin-bottom: var(--goa-spacing-xl);
  }

  .title {
    font-size: var(--fs-base);
    font-weight: var(--fw-bold);
    padding-bottom: 12px;
    padding-top: 8px;
  }

  @media (max-width: 1280px) {
    .desktop {
      display: none;
    }

    .mobile > div {
      padding: 2px 0 2px 3px;
    }
  }
`;
export const Modal = styled.div`
  display: block;
  position: fixed;
  left: 0;
  z-index: 10000;
  width: 100%;
`;

export const PreviewTemplateContainer = styled.div`
  width: calc(40vw + 3.9rem);
  margin-right: var(--goa-spacing-xl);
  margin-left: var(--goa-spacing-xl);
  overflow: hidden;
  padding-top: var(--goa-spacing-xs);
  &:hover {
    overflow: auto;
  }
`;
export const MonacoDiv = styled.div`
  display: flex;
  border: var(--goa-border-width-s) solid var(--color-gray-700);
  border-radius: var(--goa-border-radius-m);
  padding: var(--goa-spacing-3xs);
`;
export const MonacoDivBody = styled.div`
  display: flex;
  border: var(--goa-border-width-s) solid var(--color-gray-700);
  border-radius: var(--goa-border-radius-m);
  padding-top: var(--goa-spacing-l);
  padding: var(--goa-spacing-3xs);
  min-height: var(--goa-spacing-xl);
  margin: 0;
`;

export const EditTemplateActions = styled.div`
  display: flex;
  justify-content: left;
  gap: var(--goa-spacing-m);
  margin: var(--goa-spacing-m) 0 var(--goa-spacing-xl) 0;
`;

// preview template components
export const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 85%;
`;

export const SubjectPreview = styled.div`
  background-color: white;
  padding-left: var(--goa-spacing-m);
`;

export const BodyPreview = styled(PreviewPortal)`
  background-color: var(--goa-color-greyscale-white);
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
  flex-grow: 1;
  margin-bottom: var(--goa-spacing-m);
  border: var(--goa-spacing-l) solid var(--goa-color-info-light);
`;

export const PdfEditorLabelWrapper = styled.div`
  display: block;
  flex-direction: row;
  overflow-x: hidden;
  overflow-y: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 4.5rem;

  .badge {
    margin: 0px 0px 0px 3px;
  }
`; // no spacing design token for 4.5rem and 3px

export const PdfConfigFormWrapper = styled.div`
  margin-top: var(--goa-spacing-xl);
  font-size: var(--goa-fontSize-3);
  padding-left: 3px;
  border: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
  border-radius: 3px;
  height: 7.375rem;
  background-color: var(--goa-color-greyscale-100);
  padding-right: var(--goa-color-greyscale-100);

  display: flex;
  margin-bottom: var(--goa-spacing-l);
  .nameColumn {
    width: 91px;
    height: 85px;
    margin: var(--goa-spacing-m);
  }
  .idColumn {
    width: 105px;
    height: 118px;
    margin: var(--goa-spacing-m);
  }
  .descColumn {
    width: 606px;
    height: 118px;
    margin: var(--goa-spacing-m);
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

    margin: var(--goa-spacing-m) var(--goa-spacing-m) var(--goa-spacing-m) auto;
  }
  .separator {
    margin-top: var(--goa-spacing-m);
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

export const PdfEditActionLayout = styled.div`
  bottom: var(--goa-spacing-3xl);
`;

export const SpinnerSpace = styled.div`
  margin: 10px 9px 10px 14px;
  float: right;
`;

export const GeneratorStyling = styled.div`
  .extra-padding {
    margin: 20px 0 0 0;
  }

  .topBottomPadding {
    padding: 15px 0;
  }

  .row-flex {
    display: flex;
    flex-direction: row;
  }

  .indicator {
    background: #f3f3f3;
    min-width: 160px;
  }

  .event-stream {
    flex: 3;
    fontsize: 12px;
  }

  .button-margin {
    margin: 0 0 20px 0;
  }
`;
export const SpinnerPadding = styled.div`
  margin: 200px 0 0 0;
`;

export const SpinnerModalPadding = styled.div`
  margin: 0 0 0 0;
  height: 467px;
`;

export const SpinnerPaddingSmall = styled.div`
  margin: 0 0 0 5px;
  float: right;
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
    margin-right: var(--goa-spacing-xs);
    text-decoration: underline;
    line-height: 28px;
  }
  display: flex;
  flex-direction: row;
  margin-right: var(--goa-spacing-m);
  margin-top: 0;
  padding-top: var(--goa-spacing-3xs);
`;
export const OverflowWrap = styled.div`
  overflow-wrap: break-word;
  overflow-y: hidden;
`;

export const PreviewTopStyle = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  gap: var(--goa-spacing-l);
  align-items: flex-start;
`;

export const PreviewTopStyleWrapper = styled.div`
  .hr-resize {
    margin-bottom: var(--goa-spacing-xl);
  }
`;

export const PDFTitle = styled.div`
  font-size: var(--fs-xl);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
  font-family: var(--goa-font-family-sans);
  margin-bottom: var(--goa-spacing-s);
}
`;

export const HideTablet = styled.div`
  @media (max-height: 629px) {
    display: none;
  }

  @media (max-width: 1439px) {
    display: none;
  }
`;

export const TabletMessage = styled.div`
  h1,
  h3 {
    text-align: center;
    margin: 40px;
    var(--goa-typography-heading-m)
  }

  text-align: center !important;

  @media (min-height: 630px) {
    @media (min-width: 1440px) {
      display: none;
    }
  }
`;
export const PdfFormItem = styled.div`
  margin-bottom: 1.5rem;
  margin-left: 3px;
  margin-right: 3px;
`;

export const HelpText = styled.div`
  font-size: var(--fs-sm);
  color: var(--color-gray-900);
  line-height: calc(var(--fs-sm) + var(--goa-spacing-xs));
  display: flex;
  display-direction: row;
  justify-content: space-between;
  margin-top: 2px;
`;
export const DescriptionItem = styled.div`
  margin-left: 3px;
  margin-right: 3px;
`;

export const ErrorMsg = styled.div`
   {
    display: inline-flex;
    color: var(--color-red);
    pointer-events: none;
    gap: 0.25rem;
  }
`;

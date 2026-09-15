import styled, { createGlobalStyle } from 'styled-components';

interface HeightProps {
  height: number;
}
export const Buttons = styled.div`
  margin: 2rem 0 2rem 0;
  text-align: left;
`;

export const NotificationBorder = styled.div`
  margin: 3px;
`;

export const EventBorder = styled.div`
  border: 1px solid #e6e6e6;
  margin: 3px;
  border-radius: 3px;
  padding: 20px;
`;

export const EventButtonWrapper = styled.div`
  text-align: center;
  margin: 19px 0;
`;

export const MaxHeight = styled.div<HeightProps>`
  max-height: ${(p) => p.height + 'px'};
`;
export const DescriptionText = styled.div`
  font-size: var(--goa-font-size-4);
  line-height: 28px;
  margin-bottom: 28px;
  margin-top: 14px;
`;
export const NotificationStyles = styled.div`
  padding: 1rem 0;
  .gridBoxHeight {
    height: 10.5rem;
  }

  .nonCoreIconPadding {
    height: 23px;
    margin: 0 9px 0 9px;
  }

  .coreIconPadding {
    height: 23px;
    margin: 0 4px 0 4px;
  }

  .smallFont {
    font-size: 12px;
  }

  svg {
    color: #56a0d8;
  }

  .goa-title {
    margin-bottom: 14px !important;
  }

  .topBottomMargin {
    margin: 10px 0;
  }

  .rowFlex {
    display: flex;
    flex-direction: row;
  }

  .columnFlex {
    display: flex;
    flex-direction: column;
  }

  .height-100 {
    height: 100px;
  }

  .height-120 {
    height: 120px;
  }

  .flex {
    display: flex;
  }

  .flex1 {
    flex: 1;
  }

  .flex3 {
    flex: 3;
  }

  .flex4 {
    flex: 4;
  }

  .flex5 {
    flex: 5;
  }

  .padding {
    padding: 20px;
  }

  .mail-outline {
    padding: 0px 3px;
  }

  .flexEndAlign {
    align-items: flex-end;
  }

  .endAlign {
    align-self: end;
  }

  .rightAlignEdit {
    text-align: end;
    width: 100%;
  }
  .noCursor {
    cursor: default;
  }

  .minimumLineHeight {
    line-height: 0.75rem;
  }

  .icon-badge-group .icon-badge-container {
    display: inline-block;
    margin-left: 15px;
  }

  .icon-badge-group .icon-badge-container:first-child {
    margin-left: 0;
  }

  .icon-badge-container {
    margin-top: 5px;
    position: relative;
  }

  .icon-badge-icon {
    font-size: 30px;
    position: relative;
  }

  .icon-badge {
    background-color: #feba35;
    font-size: 15px;
    font-weight: bolder;
    color: black;
    text-align: center;
    font-family: sans-serif;
    width: 18px;
    height: 18px;
    border-radius: 100%;
    position: relative;
    top: -35px;
    left: 17px;
    border: solid 1px;
  }

  .badgePadding > div {
    padding: 2px 0 2px 3px;
  }

  .marginTopAuto {
    margin-top: auto;
  }

  .textAlignLastRight {
    display: contents;
  }

  .resetButton {
    margin-right: 10px;
    font-size: 15px;
  }

  .coreEditButton {
    font-size: 15px;
  }
`;

export const PreviewTemplateContainer = styled.div`
  flex: 1;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  margin-left: 1rem;
  padding-top: 2rem;
  padding-left: 1rem;
  background-color: #c3c3c3;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
`;

export const NotificationTemplateEditorContainer = styled.div`
  display: flex;
  padding-left: 1.5rem;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
`;

export const Modal = styled.div<{ open: boolean }>`
  display: ${(props) => (props.open ? `block` : `none`)};
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 10000;
  width: 100%;
`;

export const BodyGlobalStyles = createGlobalStyle<{ hideOverflow: boolean }>`
  body {
    overflow:  ${(props) => (props.hideOverflow ? `hidden` : `auto`)};
  }
`;

export const ModalContent = styled.div`
  background: white;
`;

export const Anchor = styled.div`
  color: #0070c4;
  text-decoration: underline;
  outline: none;
  cursor: pointer;
`;

export const NotificationTypeDetailLayout = styled.div`
  display: grid;
  gap: var(--goa-space-l);
  padding: 0 var(--goa-space-m) var(--goa-space-l);
`;

export const NotificationTypeSummarySection = styled.section`
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  padding: var(--goa-space-xl) var(--goa-space-2xl);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--goa-space-xl);
`;

export const NotificationTypeSummaryContent = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--goa-space-m);

  h2 {
    margin-top: 0;
  }
`;

export const NotificationTypeAccent = styled.div`
  width: 2px;
  background: var(--color-primary);
`;

export const NotificationTypeSummaryActions = styled.div`
  border-left: 1px solid #dcdcdc;
  padding-left: var(--goa-space-xl);
  display: grid;
  align-content: start;
  gap: var(--goa-space-l);
`;

export const NotificationTypeActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--goa-space-m);
  padding-right: var(--goa-space-s);
`;

export const NotificationTypeStatusGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: var(--goa-space-s) var(--goa-space-m);
  padding-right: var(--goa-space-s);
`;

export const NotificationTypeStatusPill = styled.span`
  background: #eee;
  border-radius: 1rem;
  padding: 0.25rem 0.75rem;
  font-weight: var(--fw-bold);
`;

export const NotificationTypeStrategyDetail = styled.p`
  display: grid;
  gap: var(--goa-space-xs);

  code {
    font-family: var(--goa-font-family-monospace);
    overflow-wrap: anywhere;
  }
`;

export const NotificationTypeSection = styled.section`
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  padding: var(--goa-space-l) 0 var(--goa-space-2xl);
`;

export const NotificationTypeSectionContent = styled.div`
  padding: 0 var(--goa-space-l);
`;

export const NotificationTypeSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--goa-space-m);
  margin-bottom: var(--goa-space-m);

  h2 {
    margin-top: 0;
    margin-bottom: var(--goa-space-xs);
  }
`;

export const NotificationTypeSectionAction = styled.div`
  flex-shrink: 0;
  padding-top: var(--goa-space-s);
`;

export const EventCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--goa-space-m);
`;

export const EventCard = styled.div`
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  padding: var(--goa-space-m) var(--goa-space-l);
  min-height: 170px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const EventCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--goa-space-m);
  font-weight: var(--fw-bold);

  > goa-icon-button {
    margin-right: calc(var(--goa-space-xs) * -1);
  }
`;

export const ChannelStatus = styled.div`
  display: grid;
  gap: var(--goa-space-xs);
  color: #555;
`;

export const ChannelStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-s);
`;

export const EventCardActions = styled.div`
  text-align: right;
`;

export const EmptyRecipients = styled.p`
  margin: var(--goa-space-m) 0 0;
  color: #555;
`;

export const RecipientsTableFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-m);
  padding-top: var(--goa-space-l);
  color: #555;
`;

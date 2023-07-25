import styled from 'styled-components';

interface HeightProps {
  height: number;
}
export const Buttons = styled.div`
  margin: 2rem 0 2rem 0;
  text-align: left;
`;

export const NotificationBorder = styled.div`
  border: 1px solid #666666;
  margin: 3px;
  border-radius: 3px;
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

export const MaxHeight = styled.div`
  max-height: ${(p: HeightProps) => p.height + 'px'};
`;

export const NotificationStyles = styled.div`
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

  .smallPadding {
    padding: 3px;
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
    text-align-last: right;
  }

  .resetButton {
    margin-right: 10px;
    font-size: 15px;
  }

  .coreEditButton {
    font-size: 15px;
  }
`;

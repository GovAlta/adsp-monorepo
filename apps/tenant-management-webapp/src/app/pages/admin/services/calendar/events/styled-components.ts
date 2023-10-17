import styled from 'styled-components';

export const SelectCalendarHeader = styled.div`
  margin-top: var(--goa-spacing-m);
  font-weight: var(--fw-bold);
  margin-bottom: var(--goa-spacing-xs);
`;

export const TitleSpace = styled.div`
  height: var(--goa-spacing-m);
`;

export const EventDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-spacing-m);
  text-align: left;
  padding: var(--goa-spacing-m);
`;

export const EventDetailRow = styled.tr`
  background: #f3f3f3 !important;
  .event-name: {
    font-size: var(--goa-font-size-7);
  }
`;

export const ProgressWrapper = styled.div`
  margin-left: 30%;
`;

export const EventDetailTd = styled.td`
  padding: var(--goa-spacing-l) !important;
`;

export const EventDetailName = styled.div`
  font-size: var(--goa-font-size-4);
  padding-bottom: 0.875rem;
`;

export const EventDetailDescription = styled.div`
  color: var(--goa-color-greyscale-700);
  font-size: var(--goa-font-size-3);
`;

export const EventDetailDate = styled.div`
  font-size: var(--goa-font-size-4);
  color: var(--goa-color-greyscale-700);
  padding-bottom: var(--goa-spacing-m);
`;

export const CalendarEventListWrapper = styled.div`
  padding-bottom: var(--goa-spacing-l);
`;

export const EventListNameTd = styled.td`
  width: 15%;
`;

export const CalendarEventTabWrapper = styled.div`
  width: 37.5rem;
`;

export const CalendarEventRow = styled.tr`
  vertical-align: top;
`;

export const EventDetailGap = styled.div`
  height: var(--goa-spacing-m);
`;

export const EventDetailsActionsWrapper = styled.div`
  display: flex;
  -webkit-align-items: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  gap: 0.25rem;
`;

export const EventFilterWrapper = styled.div`
  width: 37.5rem;
  margin-top: calc(var(--goa-spacing-l) - 8px);
  margin-bottom: var(--goa-spacing-l);
`;

export const EventFilterButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-right: 6px;
  margin-top: var(--goa-spacing-l);
  margin-bottom: var(--goa-spacing-xl);
`;

export const CalendarEventFilterError = styled.span`
  color: var(--goa-color-emergency-default);
  padding-left: 5px;
  display: inline-flex;
  line-height: 2.5rem;
  position: relative;
  top: -3px;
`;

// There might be a bug for the scroll, we need more padding to show the load more button in some case
export const LoadMoreWrapper = styled.div`
  padding-bottom: var(--goa-spacing-4xl);
`;

export const EventTableHeader = styled.div`
  font-size: var(--goa-font-size-7);
  line-height: var(--goa-spacing-xl);
  margin-top: var(--goa-spacing-xl);
  margin-bottom: var(--goa-spacing-l);
`;

export const CalendarNameText = styled.span`
  max-width: 5rem;
  word-break: break-all;
`;

export const FilterTitle = styled.h4`
  margin: 0px !important;
`;

import styled from 'styled-components';

export const SelectCalendarHeader = styled.div`
  margin-top: var(--goa-space-m);
  font-weight: var(--fw-bold);
  margin-bottom: var(--goa-space-xs);
`;

export const TitleSpace = styled.div`
  height: var(--goa-space-m);
`;

export const EventDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-space-m);
  text-align: left;
  padding: var(--goa-space-m);
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
  padding: var(--goa-space-l) !important;
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
  padding-bottom: var(--goa-space-m);
`;

export const CalendarEventListWrapper = styled.div`
  padding-bottom: var(--goa-space-l);
  margin-top: var(--goa-space-m);
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
  height: var(--goa-space-m);
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
  margin-top: calc(var(--goa-space-l) - 8px);
  margin-bottom: var(--goa-space-l);
  position: relative;
  z-index: 0;
`;

export const EventFilterButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-right: 6px;
  margin-top: var(--goa-space-l);
  margin-bottom: var(--goa-space-xl);
`;

export const CalendarEventFilterError = styled.span`
  color: var(--goa-color-emergency-default);
  padding-left: 5px;
  display: inline-flex;
  line-height: 2.5rem;
  position: relative;
  top: -3px;
`;

export const CalendarDropdownWrapper = styled.div`
  padding-right: 3px;
`;

// There might be a bug for the scroll, we need more padding to show the load more button in some case
// export const LoadMoreWrapper = styled.div`
//   padding-bottom: var(--goa-space-4xl);
// `;

export const EventTableHeader = styled.div`
  font-size: var(--goa-font-size-7);
  line-height: var(--goa-space-xl);
  margin-top: var(--goa-space-xl);
  margin-bottom: var(--goa-space-l);
`;

export const CalendarNameText = styled.span`
  max-width: 5rem;
  word-break: break-all;
`;

export const FilterTitle = styled.h4`
  margin: 0px !important;
`;

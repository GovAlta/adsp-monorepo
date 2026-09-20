import styled from 'styled-components';

export const HeadingDiv = styled.div`
  display: flex;
  column-gap: 0.6rem;

  img {
    margin-bottom: 4px;
  }
`;

export const SectionsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-l);
  margin-top: var(--goa-space-l);
  min-width: 0;
`;

export const TrendsRow = styled.div<{ $hasRail?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--goa-space-l);
  align-items: start;
  min-width: 0;

  @media (min-width: 1024px) {
    grid-template-columns: ${(props) => (props.$hasRail ? 'minmax(0, 2fr) minmax(0, 1fr)' : 'minmax(0, 1fr)')};
  }
`;

export const RightRail = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-l);
  min-width: 0;
`;

export const SectionHeading = styled.h2`
  margin-top: 0;
  margin-bottom: var(--goa-space-s);
  font-size: var(--goa-font-size-7);
`;

export const ControlsRow = styled.div`
  margin-top: var(--goa-space-m);
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--goa-space-s);
  min-width: 0;
  width: 100%;
`;

export const ControlField = styled.div<{ $grow?: boolean }>`
  flex: ${(props) => (props.$grow ? '1 1 20rem' : '0 1 20rem')};
  min-width: 0;
  max-width: 100%;

  goa-form-item,
  goa-dropdown,
  goa-date-picker {
    display: block;
    width: 100%;
    max-width: 100%;
  }
`;

export const ReportingPeriodFields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 20rem));
  justify-content: start;
  align-items: start;
  gap: var(--goa-space-s);
  min-width: 0;
`;

export const PlaceholderBlock = styled.div<{ $minHeight: string }>`
  min-height: ${(props) => props.$minHeight};
  background: var(--goa-color-greyscale-100);
  border: 1px dashed var(--goa-color-greyscale-400);
  border-radius: var(--goa-border-radius-m);
`;

export const SummaryMetricCard = styled.div`
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  padding: var(--goa-space-m);
`;

export const SummaryMetricValue = styled.div`
  font-size: var(--goa-font-size-9);
  font-weight: var(--fw-bold);
  padding-bottom: var(--goa-space-xs);
`;

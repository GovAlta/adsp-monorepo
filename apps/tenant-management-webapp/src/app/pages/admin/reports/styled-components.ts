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
`;

export const SectionHeading = styled.h2`
  margin-top: 0;
  margin-bottom: var(--goa-space-s);
  font-size: var(--goa-font-size-7);
`;

export const ControlsRow = styled.div`
  margin-top: var(--goa-space-m);
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

export const CustomRangeRow = styled.div`
  margin-top: var(--goa-space-s);
`;

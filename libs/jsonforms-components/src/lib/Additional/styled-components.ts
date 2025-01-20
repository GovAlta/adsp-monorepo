import styled from 'styled-components';

export const HelpContentDiv = styled.div`
  .parent-label {
    font-size: 24px;
    margin-bottom: var(--goa-space-m);
    font-weight: bold;
  }

  .child-label {
    font-size: 18px;
    margin-bottom: var(--goa-space-xs);
    font-weight: bold;
  }
  .parent-margin {
    margin-bottom: var(--goa-space-l);
  }
  .child-margin {
    margin-bottom: var(--goa-space-2xs);
  }
  ul {
    margin: 0 0 0 var(--goa-space-xs);
  }
  .single-line {
    margin: var(--goa-space-2xs) 0 var(--goa-space-2xs) 0;
  }
`;

export const InvalidMarkdown = styled.div`
  color: var(--goa-color-interactive-error);
`;

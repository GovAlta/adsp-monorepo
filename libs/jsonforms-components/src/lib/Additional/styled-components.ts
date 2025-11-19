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

  .help-content-markdown details {
    margin: 1.5rem 0 !important;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif !important;
  }

  .help-content-markdown details summary {
    font-size: 1.5em;
    font-weight: bold;
    color: red;
    list-style: none;
    cursor: pointer;
    position: relative;
    padding-left: 0;
    font-weight: 600;
    font-size: 1.125rem; /* 18px */
    color: #111827; /* gray-900 */
    user-select: none;
    border-left: 0; /* vertical line */
  }

  .help-content-markdown details summary::before {
    content: '';
    display: inline-block;
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.5rem;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='48' d='M184 112l144 144-144 144'/></svg>");
    background-size: contain;
    background-repeat: no-repeat;
    transition: opacity 0.2s ease;
  }

  .help-content-markdown details[open] summary::before {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='48' d='M112 184l144 144 144-144'/></svg>");
  }

  .help-content-markdown details[open] {
    margin-left: 1.75rem !important;
  }
  .help-content-markdown details[open] summary {
    margin-left: -1.75rem !important;
  }

  .help-content-markdown details[open] {
    position: relative;
  }

  .help-content-markdown details[open]::before {
    margin-left: -1.75rem !important;
    content: '';
    position: absolute;
    left: 0.6rem;
    top: 2.2rem;
    bottom: 0.5rem;
    width: 2px;
    background-color: #ccc;
    pointer-events: none;
  }

  .help-content-markdown summary {
    text-decoration: underline;
  }
`;

export const InvalidMarkdown = styled.div`
  color: var(--goa-color-interactive-error);
`;

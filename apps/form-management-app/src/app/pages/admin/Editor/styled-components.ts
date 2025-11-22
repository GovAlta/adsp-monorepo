import styled from 'styled-components';

export const EditorPadding = styled.div`
  border: 1px solid grey;
  border-radius: 3px;
  padding: 0.15rem;

  .monaco-scrollable-element {
    margin-top: 5px !important;
  }
  .margin-view-overlays {
    margin-top: 5px !important;
  }
`;

export const FormEditorTitle = styled.div`
  font-size: var(--goa-font-size-7);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
`;



export const NameDescriptionDataSchema = styled.div`
  flex: 6;
  padding-right: 3rem;

  .life-cycle-auto-scroll {
    overflow-y: auto;
  }
`;

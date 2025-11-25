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

export const FormEditor = styled.div`
  width: 100%;

  .hr-resize {
    margin-top: var(--goa-space-s);
  }

  .hr-resize-bottom {
    margin-bottom: var(--goa-space-2xs);
    margin-top: var(--goa-space-xl);
  }

  .info-circle {
    margin: 5px 0 0 5px;
  }
`;

export const FormTemplateEditorContainer = styled.div`
  display: flex;
  flex: auto;
  margin-top: 6px;
  padding-left: 3rem;
  padding-right: 3rem;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
`;


export const FormPreviewContainer = styled.div`
  width: 50%;
`;

export const FinalButtonPadding = styled.div`
  display: flex;
  padding-top: 20px;
  justify-content: space-between;
  align-items: center;
`;
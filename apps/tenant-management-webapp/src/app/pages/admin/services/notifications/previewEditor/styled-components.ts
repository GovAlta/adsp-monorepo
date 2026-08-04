import styled from 'styled-components';
import { PreviewPortal } from './previewPortal';
import { SlackPreviewPortal } from './slackPreviewPortal';
import { SmsPreviewPortal } from './smsPreviewPortal';

// Edit Template components
export const TemplateEditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 48%;
  min-height: calc(100vh - 4rem);
  padding-right: 0.5rem;
  margin-top: 2rem;
  overflow: hidden;

  &:hover {
    overflow: auto;
  }

  /* Compact the accordion chrome so the header costs one short line instead of two.
     These custom properties inherit into the component's shadow root. */
  goa-accordion {
    --goa-accordion-heading-s: var(--goa-typography-heading-xs);
    --goa-accordion-heading-min-height: 2.5rem;
    --goa-accordion-padding-heading-icon-left: var(--goa-space-xs) var(--goa-space-s) var(--goa-space-xs) 0;
    --goa-accordion-padding-content-narrow: var(--goa-space-s);
    --goa-accordion-padding-content-wide: var(--goa-space-s);
  }

  @media (min-width: 1279px) {
    .mobile {
      display: none;
    }
  }

  @media (max-width: 1280px) {
    .desktop {
      display: none;
    }

    .mobile > div {
      padding: 2px 0 2px 3px;
    }
  }
`;

export const MonacoDiv = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
`;
// The height budget subtracted below accounts for the fixed chrome above the body editor.
// When the properties section is collapsed its accordion header (~52px) replaces the three
// subject-style form items (~91px each) plus the default-template checkbox and body hint,
// freeing ~290px for the body editor.
export const MonacoDivBody = styled.div<{ $compact?: boolean }>`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
  height: ${({ $compact }) => ($compact ? 'calc(100vh - 285px)' : 'calc(100vh - 645px)')};
  min-height: 65px;

  @media (max-width: 1420px) {
    height: ${({ $compact }) => ($compact ? 'calc(100vh - 195px)' : 'calc(100vh - 555px)')};
  }
  @media (max-height: 920px) {
    height: ${({ $compact }) => ($compact ? 'calc(100vh - 310px)' : 'calc(100vh - 670px)')};
  }
`;

// Keeps the long "Edit an <channel> template--<service>" heading from eating two lines of
// vertical space that the body editor could use instead.
export const TemplateEditorTitle = styled.h3`
  font: var(--goa-typography-heading-xs);
  /* Padding rather than margin: the title is the first child of the tab panel, so a top
     margin collapses out to the ancestor and has no visible effect. */
  margin: 0 0 var(--goa-space-xs) 0;
  padding: var(--goa-space-m) 0 0 0;
  overflow-wrap: anywhere;
`;

export const TemplatePropertiesSummary = styled.span`
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font: var(--goa-typography-body-s);
  color: var(--goa-color-text-secondary);
`;

export const TemplatePropertiesActions = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--goa-space-xs);
`;
// Pinned to the bottom of the editor pane so "Save all" / "Close" stay reachable when
// expanding the properties section pushes the content past the fold.
export const EditTemplateActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: auto;
  position: sticky;
  bottom: 0;
  z-index: 1;
  background: white;
  border-top: 1px solid var(--goa-color-greyscale-200);
  padding: 1rem 0 0.5rem 0
  padding-top: 1rem;
`;

// preview template components
export const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-right: 2rem;
`;

export const SubjectPreview = styled.div`
  background-color: white;
  padding-left: 1rem;
`;

export const BodyPreview = styled(PreviewPortal)`
  background-color: white;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
  flex-grow: 1;
  margin-bottom: 2rem;
`;

export const SlackPreview = styled(SlackPreviewPortal)`
  background-color: white;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
  flex-grow: 1;
  margin-bottom: 2rem;
`;
export const SMSBodyPreview = styled(SmsPreviewPortal)`
  background-color: white;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
  flex-grow: 1;
  margin-bottom: 2rem;
`;

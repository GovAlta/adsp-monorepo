import styled from 'styled-components';

export const Page = styled.main`
  --builder-bg: var(--goa-color-greyscale-white);
  --builder-panel: rgba(255, 255, 255, 0.95);
  --builder-ink: var(--goa-color-text-default);
  --builder-muted: var(--goa-color-text-secondary);
  --builder-line: var(--goa-color-greyscale-200);
  --builder-shadow: 0 18px 50px rgba(22, 34, 49, 0.16);
  --builder-preview-right-gutter: clamp(7rem, 18vw, 14rem);
  --builder-floating-panel-width: min(36rem, calc(100vw - 2.5rem));

  min-height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  color: var(--builder-ink);
  background: var(--builder-bg);

  & band-component {
    flex-shrink: 0;
    height: 10rem;
  }

  & > cds-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    justify-content: center;
  }

  @media (max-width: 1200px) {
    --builder-preview-right-gutter: clamp(4.5rem, 13vw, 9rem);
    --builder-floating-panel-width: min(33rem, calc(100vw - 2rem));
  }

  @media (max-width: 900px) {
    --builder-preview-right-gutter: 0;
  }
`;

export const Shell = styled.section`
  position: fixed;
  inset: 0;
  padding: 0;
  min-height: 0;
  background: linear-gradient(
    to right,
    #ffffff 0 calc(100% - var(--builder-preview-right-gutter)),
    var(--goa-color-greyscale-100, #f7f8f9) calc(100% - var(--builder-preview-right-gutter)) 100%
  );

  @media (max-width: 900px) {
    position: static;
    inset: auto;
  }
`;

export const PrimaryPreviewViewport = styled.section`
  position: absolute;
  inset: 0 var(--builder-preview-right-gutter) 0 0;
  background: #ffffff;

  @media (max-width: 900px) {
    position: static;
    min-height: 60vh;
  }
`;

export const PreviewViewportFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: 0;
  background: #ffffff;
  display: block;

  @media (max-width: 900px) {
    min-height: 60vh;
  }
`;

export const SignInPanel = styled.section`
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const PanelSubtle = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.9rem;
  color: var(--builder-muted);
`;

import styled, { css, keyframes } from 'styled-components';

const refreshSpin = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

export const PanelLauncher = styled.div`
  position: fixed;
  right: 0.75rem;
  bottom: 1rem;
  z-index: 90;
  display: inline-flex;

  @media (max-width: 900px) {
    position: static;
    margin: 0 1rem 1rem;
    width: fit-content;
  }
`;

export const Panel = styled.section`
  position: fixed;
  right: 0.75rem;
  bottom: 1rem;
  width: var(--builder-floating-panel-width, min(36rem, calc(100vw - 2.5rem)));
  height: 82vh;
  min-height: 34rem;
  max-height: 82vh;
  z-index: 90;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--builder-shadow, 0 18px 50px rgba(22, 34, 49, 0.16));
  backdrop-filter: blur(6px);

  @media (max-width: 1200px) {
    height: 78vh;
    max-height: 78vh;
  }

  @media (max-width: 900px) {
    position: static;
    width: auto;
    height: auto;
    min-height: 0;
    max-height: none;
    margin: 0 1rem 1rem;
  }
`;

export const PanelHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  border-bottom: 1px solid var(--builder-line, #dfe2e5);
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
`;

export const PanelSubtle = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.9rem;
  color: var(--builder-muted, #596b7e);
`;

export const PanelHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;

  @media (max-width: 1200px) {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
`;

export const PanelCollapseButton = styled.div`
  display: inline-flex;
`;

export const TabContainer = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  & goa-tabs {
    flex: 0;
    margin: 0;
    --goa-tabs-gap: var(--goa-space-none);
    --goa-tabs-gap-small-screen: var(--goa-space-none);
    --goa-tabs-padding-bottom-small-screen: var(--goa-space-none);
  }
`;

export const TabContentArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: -2rem;

  @media (max-width: 623px) {
    margin-top: 0;
  }
`;

export const ChatPane = styled.div`
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 0.75rem 0.75rem 1rem;
  box-sizing: border-box;
`;

export const InfoPaneBody = styled.div`
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 1rem 0.8rem;
  gap: 1rem;
`;

export const PanelLabel = styled.p`
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--builder-muted, #596b7e);
  font-weight: 700;
`;

export const PanelValue = styled.p`
  margin: 0.35rem 0 0;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--builder-ink, #162231);
  word-break: break-word;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

export const WorkspaceTabPane = styled.div`
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const EmptyWorkspaceState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  overflow: auto;
`;

export const UrnHint = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: #666;
`;

export const UrnCode = styled.code`
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
`;

export const WorkspacePaneBody = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const WorkspaceTopBar = styled.div`
  min-height: 2.6rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--builder-line, #dfe2e5);
`;

export const WorkspaceBreadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.6rem;
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.85rem;
`;

export const BreadcrumbLink = styled.button`
  border: 0;
  background: transparent;
  color: var(--goa-color-interactive-default, #146ca4);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
`;

export const BreadcrumbDivider = styled.span`
  color: var(--builder-muted, #596b7e);
  font-size: 0.85rem;
`;

export const BreadcrumbCurrent = styled.span`
  min-width: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--builder-ink, #162231);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const WorkspacePaneMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.6rem;
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.85rem;
`;

export const WorkspaceStage = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

export const WorkspaceView = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition:
    opacity 200ms ease,
    transform 200ms ease;
  opacity: ${(props) => (props.$active ? 1 : 0)};
  transform: translateX(${(props) => (props.$active ? '0' : '1.5rem')});
  pointer-events: ${(props) => (props.$active ? 'auto' : 'none')};
`;

export const FileList = styled.ul`
  margin: 0;
  padding: 0.35rem 0.45rem;
  list-style: none;
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
`;

export const FileButton = styled.button<{ $isActive: boolean; $isUpdated: boolean }>`
  width: 100%;
  border: 1px solid transparent;
  padding: 0.55rem 0.65rem;
  border-radius: 0.75rem;
  text-align: left;
  background: var(--goa-color-greyscale-white, #ffffff);
  color: inherit;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    background: var(--goa-color-interactive-light, #f1f8fe);
    border-color: rgba(17, 91, 142, 0.18);
  }

  ${(props) =>
    props.$isActive &&
    css`
      background: var(--goa-color-interactive-light, #f1f8fe);
      border-color: rgba(17, 91, 142, 0.18);
    `}

  ${(props) =>
    props.$isUpdated &&
    css`
      box-shadow: inset 0 0 0 1px rgba(17, 91, 142, 0.28);
    `}

  &:focus-visible {
    outline: 2px solid var(--goa-color-interactive-default, #146ca4);
    outline-offset: 1px;
  }
`;

export const FilePathRow = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const FilePath = styled.span`
  display: block;
  font-weight: 700;
  font-size: 0.88rem;
  line-height: 1.25;
`;

export const FileUpdateBadge = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: rgba(17, 91, 142, 0.14);
  color: #115b8e;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

export const FileMeta = styled.span`
  display: block;
  margin-top: 0.1rem;
  font-size: 0.74rem;
  line-height: 1.2;
  color: var(--builder-muted, #596b7e);
`;

export const FileContent = styled.pre`
  margin: 0;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0.9rem;
  background: var(--goa-color-greyscale-white, #ffffff);
  color: var(--builder-ink, #162231);
  font-size: 0.8rem;
  line-height: 1.5;
  font-family:
    ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
`;

export const Composer = styled.div`
  padding: 0.55rem 0.8rem 0.65rem;
  border-top: 1px solid var(--builder-line, #dfe2e5);
`;

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

export const TarballForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

export const WorkspaceActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

export const WorkspaceActionRefresh = styled.div<{ $busy: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  margin-left: auto;
  color: ${(props) => (props.$busy ? 'var(--goa-color-interactive-default, #146ca4)' : 'inherit')};

  & goa-icon-button {
    animation: ${(props) =>
      props.$busy
        ? css`
            ${refreshSpin} 900ms linear infinite
          `
        : 'none'};
  }
`;

export const WorkspaceActionRefreshLabel = styled.span<{ $busy: boolean }>`
  min-width: 6.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  text-align: right;
  user-select: none;
  color: ${(props) =>
    props.$busy ? 'var(--goa-color-interactive-default, #146ca4)' : 'var(--builder-muted, #596b7e)'};
`;

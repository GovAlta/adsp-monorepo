import React, { useEffect, useState } from 'react';
import { AgentChat } from '@core-services/app-common';
import {
  GoabBadge,
  GoabButton,
  GoabButtonGroup,
  GoabCallout,
  GoabFormItem,
  GoabIconButton,
  GoabInput,
  GoabTab,
  GoabTabs,
} from '@abgov/react-components';
import { GoabTabsOnChangeDetail } from '@abgov/ui-components-common';
import { WorkspaceSnapshotFile, isBinaryPath, isImagePath } from '../lib/builderWorkspace';
import { type AssetThumbnail } from '../state/agent.slice';
import {
  Actions,
  AssetThumbnailImg,
  AssetThumbnailMeta,
  AssetThumbnailPane,
  BreadcrumbCurrent,
  BreadcrumbDivider,
  BreadcrumbLink,
  ChatPane,
  Composer,
  EmptyWorkspaceState,
  FileButton,
  FileContent,
  FileList,
  FileMeta,
  FilePath,
  FilePathRow,
  FileUpdateBadge,
  InfoPaneBody,
  Panel,
  PanelCollapseButton,
  PanelHeader,
  PanelHeaderActions,
  PanelLabel,
  PanelLauncher,
  PanelSubtle,
  PanelTitle,
  PanelValue,
  Stack,
  TabContainer,
  TabContentArea,
  TarballForm,
  UrnCode,
  UrnHint,
  WorkspaceActionBar,
  WorkspaceActionRefresh,
  WorkspaceActionRefreshLabel,
  WorkspaceBreadcrumb,
  WorkspacePaneBody,
  WorkspacePaneMeta,
  WorkspaceStage,
  WorkspaceTabPane,
  WorkspaceTopBar,
  WorkspaceView,
} from './BuilderEditPane.styled';

type PanelTab = 'chat' | 'workspace' | 'info';
type WorkspaceView = 'list' | 'file';

interface BuilderEditPaneProps {
  threadId: string;
  isSocketConnected: boolean;
  connectionStatus: string;
  workspaceStatus: string;
  tenantLabel: string;
  userEmail?: string;
  canSignOut: boolean;
  messages: React.ComponentProps<typeof AgentChat>['messages'];
  onSendPrompt: React.ComponentProps<typeof AgentChat>['onSend'];
  onSignOut: () => void;
  isWorkspaceEmpty: boolean;
  sortedFiles: WorkspaceSnapshotFile[];
  selectedPath: string;
  selectedFileContent: string;
  selectedAssetThumbnail: AssetThumbnail | null;
  recentlyUpdatedPaths: Record<string, number>;
  workspaceRevision?: number;
  isWorkspaceRefreshing: boolean;
  isWorkspaceSaving: boolean;
  onSelectPath: (path: string) => void;
  onInitFromTarball: (uuid: string) => void;
  onDownloadWorkspace: () => void;
  onSaveWorkspace: () => void;
  onRefreshWorkspace: () => void;
}

export const BuilderEditPane = ({
  threadId,
  isSocketConnected,
  connectionStatus,
  workspaceStatus,
  tenantLabel,
  userEmail,
  canSignOut,
  messages,
  onSendPrompt,
  onSignOut,
  isWorkspaceEmpty,
  sortedFiles,
  selectedPath,
  selectedFileContent,
  selectedAssetThumbnail,
  recentlyUpdatedPaths,
  workspaceRevision,
  isWorkspaceRefreshing,
  isWorkspaceSaving,
  onSelectPath,
  onInitFromTarball,
  onDownloadWorkspace,
  onSaveWorkspace,
  onRefreshWorkspace,
}: BuilderEditPaneProps) => {
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>('chat');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('list');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTarballForm, setShowTarballForm] = useState(false);
  const [tarballUrnInput, setTarballUrnInput] = useState('');

  const stripTabHash = () => {
    const tabHashes = new Set(['#chat', '#workspace', '#session-info']);
    if (!tabHashes.has(window.location.hash)) {
      return;
    }

    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
  };

  useEffect(() => {
    // GoA tabs can update location.hash (e.g., #chat); strip those values so auth redirects remain valid.
    const onHashChange = () => stripTabHash();
    window.addEventListener('hashchange', onHashChange);
    stripTabHash();

    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const handleInitFromTarball = () => {
    const uuid = tarballUrnInput.trim();
    if (!uuid || !isSocketConnected) {
      return;
    }

    onInitFromTarball(uuid);
    setShowTarballForm(false);
  };

  return isCollapsed ? (
    <PanelLauncher>
      <GoabIconButton
        icon="chevron-up"
        variant="dark"
        size="medium"
        ariaLabel="Open edit pane"
        onClick={() => setIsCollapsed(false)}
      />
    </PanelLauncher>
  ) : (
    <Panel id="builder-edit-pane">
      <PanelHeader>
        <div>
          <PanelTitle>Agent interaction</PanelTitle>
          <PanelSubtle>{activePanelTab === 'chat' ? connectionStatus : workspaceStatus}</PanelSubtle>
        </div>
        <PanelHeaderActions>
          <PanelCollapseButton>
            <GoabIconButton
              icon="chevron-down"
              variant="nocolor"
              size="medium"
              ariaLabel="Hide panel"
              onClick={() => setIsCollapsed(true)}
            />
          </PanelCollapseButton>
        </PanelHeaderActions>
      </PanelHeader>

      <TabContainer>
        <GoabTabs
          initialTab={1}
          onChange={(event: GoabTabsOnChangeDetail) => {
            if (event.tab === 2) setActivePanelTab('workspace');
            else if (event.tab === 3) setActivePanelTab('info');
            else setActivePanelTab('chat');
            stripTabHash();
          }}
          data-testid="builder-edit-pane-tabs"
        >
          <GoabTab heading="Chat" data-testid="builder-chat-tab" />
          <GoabTab heading="Workspace" data-testid="builder-workspace-tab" />
          <GoabTab heading="Session info" data-testid="builder-info-tab" />
        </GoabTabs>

        <TabContentArea>
          {activePanelTab === 'chat' ? (
            <ChatPane>
              <AgentChat
                disabled={!threadId || !isSocketConnected}
                threadId={threadId}
                context={{ tenant: tenantLabel }}
                messages={messages}
                onSend={onSendPrompt}
              />
            </ChatPane>
          ) : activePanelTab === 'info' ? (
            <InfoPaneBody>
              <div>
                <PanelLabel>Tenant</PanelLabel>
                <PanelValue>{tenantLabel || 'Unknown'}</PanelValue>
              </div>
              <div>
                <PanelLabel>Signed in</PanelLabel>
                <PanelValue>{userEmail ?? 'Not signed in'}</PanelValue>
              </div>
              <div>
                <PanelLabel>Thread</PanelLabel>
                <PanelValue>{threadId || 'Pending'}</PanelValue>
              </div>
              <Actions>
                {canSignOut ? (
                  <GoabButton type="secondary" size="compact" onClick={onSignOut}>
                    Sign out
                  </GoabButton>
                ) : null}
              </Actions>
            </InfoPaneBody>
          ) : (
            <WorkspaceTabPane>
              {isWorkspaceEmpty ? (
                <EmptyWorkspaceState>
                  <GoabCallout type="information" heading="Workspace is empty">
                    Provide a file service URN to initialize the workspace from a starter tarball.
                  </GoabCallout>
                  <GoabFormItem label="File ID (UUID)">
                    <div>
                      <GoabInput
                        name="tarball-uuid"
                        value={tarballUrnInput}
                        placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                        onChange={({ value }) => setTarballUrnInput(value)}
                        width="100%"
                      />
                      <UrnHint>
                        Full URN: <UrnCode>urn:ads:platform:file-service:v1:/files/{tarballUrnInput || '...'}</UrnCode>
                      </UrnHint>
                    </div>
                  </GoabFormItem>
                  <GoabButtonGroup alignment="end">
                    <GoabButton
                      type="primary"
                      size="compact"
                      disabled={!tarballUrnInput.trim()}
                      onClick={handleInitFromTarball}
                    >
                      Initialize workspace
                    </GoabButton>
                  </GoabButtonGroup>
                </EmptyWorkspaceState>
              ) : (
                <>
                  <WorkspacePaneBody>
                    <WorkspaceTopBar>
                      {workspaceView === 'file' ? (
                        <WorkspaceBreadcrumb aria-label="Workspace file navigation">
                          <BreadcrumbLink onClick={() => setWorkspaceView('list')}>Workspace files</BreadcrumbLink>
                          <BreadcrumbDivider>/</BreadcrumbDivider>
                          <BreadcrumbCurrent>{selectedPath}</BreadcrumbCurrent>
                        </WorkspaceBreadcrumb>
                      ) : (
                        <WorkspacePaneMeta>
                          <PanelSubtle>{sortedFiles.length} synchronized file(s)</PanelSubtle>
                          <GoabBadge
                            type="information"
                            icon={false}
                            content={workspaceRevision !== undefined ? `Revision r${workspaceRevision}` : 'No revision'}
                          />
                        </WorkspacePaneMeta>
                      )}
                    </WorkspaceTopBar>

                    <WorkspaceStage>
                      <WorkspaceView $active={workspaceView === 'list'}>
                        <FileList>
                          {sortedFiles.map((file) => (
                            <li key={file.path}>
                              <FileButton
                                $isActive={selectedPath === file.path}
                                $isUpdated={Boolean(recentlyUpdatedPaths[file.path])}
                                onClick={() => {
                                  onSelectPath(file.path);
                                  setWorkspaceView('file');
                                }}
                              >
                                <FilePathRow>
                                  <FilePath>{file.path}</FilePath>
                                  {recentlyUpdatedPaths[file.path] ? (
                                    <FileUpdateBadge aria-label="Updated by agent">Updated</FileUpdateBadge>
                                  ) : null}
                                </FilePathRow>
                                <FileMeta>{file.content.length.toLocaleString()} chars</FileMeta>
                              </FileButton>
                            </li>
                          ))}
                        </FileList>
                      </WorkspaceView>

                      <WorkspaceView $active={workspaceView === 'file'}>
                        <FileContent>
                          {isBinaryPath(selectedPath) ? (
                            isImagePath(selectedPath) && selectedAssetThumbnail?.path === selectedPath ? (
                              <AssetThumbnailPane>
                                <AssetThumbnailImg src={selectedAssetThumbnail.dataUrl} alt={selectedPath} />
                                <AssetThumbnailMeta>{selectedPath}</AssetThumbnailMeta>
                              </AssetThumbnailPane>
                            ) : (
                              <code style={{ color: '#888', fontStyle: 'italic' }}>
                                Binary asset — preview rendered in the preview pane.
                              </code>
                            )
                          ) : (
                            <code>{selectedFileContent}</code>
                          )}
                        </FileContent>
                      </WorkspaceView>
                    </WorkspaceStage>
                  </WorkspacePaneBody>

                  <Composer>
                    <Stack>
                      {showTarballForm ? (
                        <TarballForm>
                          <GoabFormItem label="File ID (UUID)">
                            <div>
                              <GoabInput
                                name="tarball-uuid"
                                value={tarballUrnInput}
                                placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                                onChange={({ value }) => setTarballUrnInput(value)}
                                width="100%"
                              />
                              <UrnHint>
                                Full URN:{' '}
                                <UrnCode>urn:ads:platform:file-service:v1:/files/{tarballUrnInput || '...'}</UrnCode>
                              </UrnHint>
                            </div>
                          </GoabFormItem>
                          <GoabButtonGroup alignment="end">
                            <GoabButton type="tertiary" size="compact" onClick={() => setShowTarballForm(false)}>
                              Cancel
                            </GoabButton>
                            <GoabButton
                              type="primary"
                              size="compact"
                              disabled={!tarballUrnInput.trim()}
                              onClick={handleInitFromTarball}
                            >
                              Load workspace
                            </GoabButton>
                          </GoabButtonGroup>
                        </TarballForm>
                      ) : (
                        <WorkspaceActionBar>
                          <GoabButtonGroup alignment="start">
                            <GoabIconButton
                              icon="save"
                              variant="nocolor"
                              title="Save workspace"
                              ariaLabel="Save workspace"
                              size="small"
                              disabled={isWorkspaceSaving || !threadId || !isSocketConnected}
                              onClick={onSaveWorkspace}
                            />
                            <GoabIconButton
                              icon="download"
                              variant="nocolor"
                              title="Download workspace"
                              ariaLabel="Download workspace"
                              size="small"
                              onClick={onDownloadWorkspace}
                            />
                            <GoabIconButton
                              icon="cloud-upload"
                              variant="nocolor"
                              title="Set workspace from tarball"
                              ariaLabel="Set workspace from tarball"
                              size="small"
                              onClick={() => setShowTarballForm(true)}
                            />
                          </GoabButtonGroup>
                          <WorkspaceActionRefresh $busy={isWorkspaceRefreshing}>
                            <WorkspaceActionRefreshLabel $busy={isWorkspaceRefreshing} aria-live="polite">
                              {isWorkspaceRefreshing ? 'Refreshing...' : 'Refresh'}
                            </WorkspaceActionRefreshLabel>
                            <GoabIconButton
                              icon="reload"
                              variant="nocolor"
                              title="Refresh workspace"
                              ariaLabel="Refresh workspace"
                              size="small"
                              disabled={isWorkspaceRefreshing || !isSocketConnected}
                              onClick={onRefreshWorkspace}
                            />
                          </WorkspaceActionRefresh>
                        </WorkspaceActionBar>
                      )}
                    </Stack>
                  </Composer>
                </>
              )}
            </WorkspaceTabPane>
          )}
        </TabContentArea>
      </TabContainer>
    </Panel>
  );
};

import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Band, Container, Grid, GridItem, type UserContent } from '@core-services/app-common';
import { GoabButton, GoabButtonGroup, GoabCallout } from '@abgov/react-components';
import {
  AppDispatch,
  AppState,
  agentActions,
  agentConnectionStatusSelector,
  agentMessagesByThreadSelector,
  agentSelectedAssetThumbnailSelector,
  agentSocketConnectedSelector,
  agentWorkspaceRefreshingSelector,
  agentWorkspaceStatusSelector,
  type BuilderAgentStreamEvent,
  configInitializedSelector,
  getAccessToken,
  initializeTenant,
  loginUser,
  logoutUser,
  lookupProjectSnapshot,
  projectIsSavingSelector,
  saveWorkspaceToFileService,
  tenantSelector,
  userSelector,
} from '../state';
import {
  applyWorkspaceChange,
  applyWorkspaceSnapshot,
  BUILDER_AGENT_ID,
  createTarArchive,
  DEFAULT_SELECTED_FILE,
  getDefaultSelectedPath,
  isImagePath,
  sortWorkspaceFiles,
  type WorkspaceChangeEvent,
  type WorkspaceFileMap,
  type WorkspaceSnapshotFile,
} from '../lib/builderWorkspace';
import { createFallbackPreviewDocument, type PreviewRouteState } from '../lib/builderPreview';
import { BuilderEditPane } from '../components/BuilderEditPane';
import {
  EmptyState,
  Page,
  PanelSubtle,
  PreviewViewportFrame,
  PrimaryPreviewViewport,
  Shell,
  SignInPanel,
} from './BuilderTenant.styled';

const RECENT_FILE_UPDATE_MS = 10000;

function normalizeWorkspacePath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\\/g, '/');
}

interface WorkspaceStateEvent {
  revision?: number;
  updatedAt?: string;
  files: WorkspaceSnapshotFile[];
}

interface BuilderPreviewSnapshot {
  version: '1.0';
  route: {
    path: string;
    hash: string;
    query: string;
  };
  document: {
    title: string;
  };
  viewport: {
    width: number;
    height: number;
    scrollY: number;
  };
  content: {
    h1: string;
    headings: string[];
    paragraphs: string[];
  };
  interactive: {
    buttons: string[];
    links: string[];
  };
  layout: {
    header: {
      position: string;
      heightPx: number | null;
      bottomPx: number | null;
    };
    main: {
      firstHeadingTopPx: number | null;
      clearanceFromHeaderPx: number | null;
    };
    footer: {
      footerTopPx: number | null;
      lastContentBottomPx: number | null;
      contentToFooterGapPx: number | null;
    };
    spacing: {
      headingToParagraphGapPx: number | null;
      sectionToSectionGapPx: number | null;
    };
    flags: {
      headerOverlapDetected: boolean;
      footerCrowdedDetected: boolean;
      inconsistentVerticalRhythmDetected: boolean;
    };
    recommendations: string[];
  };
  diagnostics: {
    capturedAt: string;
  };
}

const SNAPSHOT_MARKER_START = '[BUILDER_PREVIEW_SNAPSHOT_JSON]';
const SNAPSHOT_MARKER_END = '[/BUILDER_PREVIEW_SNAPSHOT_JSON]';

function compactText(value: string, maxLength = 160): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function uniqueNonEmpty(values: string[], limit: number, maxLength = 160): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (unique.length >= limit) {
      break;
    }

    const text = compactText(value, maxLength);
    if (!text || seen.has(text)) {
      continue;
    }

    seen.add(text);
    unique.push(text);
  }

  return unique;
}

function normalizePreviewPath(location: Location | undefined): { path: string; hash: string; query: string } {
  if (!location) {
    return { path: '/', hash: '', query: '' };
  }

  const hash = location.hash || '';
  const hashPath = hash.startsWith('#/') ? hash.slice(1) : '';

  return {
    path: hashPath || location.pathname || '/',
    hash,
    query: location.search || '',
  };
}

function capturePreviewSnapshot(frame: HTMLIFrameElement | null): BuilderPreviewSnapshot | null {
  try {
    const doc = frame?.contentDocument;
    const win = frame?.contentWindow;

    if (!doc || !win) {
      return null;
    }

    const route = normalizePreviewPath(win.location);
    const h1 = compactText(doc.querySelector('h1')?.textContent || '', 180);
    const headings = uniqueNonEmpty(
      Array.from(doc.querySelectorAll('h1, h2, h3')).map((node) => node.textContent || ''),
      12,
      140,
    );
    const paragraphs = uniqueNonEmpty(
      Array.from(doc.querySelectorAll('p')).map((node) => node.textContent || ''),
      8,
      180,
    );
    const buttons = uniqueNonEmpty(
      Array.from(doc.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')).map(
        (node) => node.textContent || (node as HTMLInputElement).value || '',
      ),
      12,
      80,
    );
    const links = uniqueNonEmpty(
      Array.from(doc.querySelectorAll('a')).map((node) => node.textContent || ''),
      20,
      80,
    );

    const headerElement = doc.querySelector('goa-app-header, .app-header-shell, header');
    const h1Element = doc.querySelector('h1');
    const footerElement = doc.querySelector('goa-app-footer, [slot="footer"], footer');
    const firstParagraph = doc.querySelector('h1 + p, p');

    const headingElements = Array.from(doc.querySelectorAll('h1, h2, h3'));
    const headingRects = headingElements.map((element) => element.getBoundingClientRect());

    const contentCandidates = Array.from(
      doc.querySelectorAll('h1, h2, h3, p, ul, ol, table, button, a, goa-callout, .feature-card, section, article'),
    );
    const lastContentElement = contentCandidates
      .filter((element) => !footerElement || !footerElement.contains(element))
      .sort((left, right) => right.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom)[0];

    const headerRect = headerElement?.getBoundingClientRect();
    const h1Rect = h1Element?.getBoundingClientRect();
    const footerRect = footerElement?.getBoundingClientRect();
    const paragraphRect = firstParagraph?.getBoundingClientRect();
    const lastContentRect = lastContentElement?.getBoundingClientRect();

    const headerBottom = headerRect ? Math.round(headerRect.bottom) : null;
    const firstHeadingTop = h1Rect ? Math.round(h1Rect.top) : null;
    const clearanceFromHeader = headerRect && h1Rect ? Math.round(h1Rect.top - headerRect.bottom) : null;
    const footerTop = footerRect ? Math.round(footerRect.top) : null;
    const lastContentBottom = lastContentRect ? Math.round(lastContentRect.bottom) : null;
    const contentToFooterGap =
      footerRect && lastContentRect ? Math.round(footerRect.top - lastContentRect.bottom) : null;

    const headingToParagraphGap = h1Rect && paragraphRect ? Math.round(paragraphRect.top - h1Rect.bottom) : null;

    const sectionGap = headingRects.length >= 2 ? Math.round(headingRects[1].top - headingRects[0].top) : null;

    const headingStepDiffs = headingRects
      .slice(1)
      .map((rect, index) => Math.round(rect.top - headingRects[index].top))
      .filter((value) => value > 0);
    const minStep = headingStepDiffs.length ? Math.min(...headingStepDiffs) : null;
    const maxStep = headingStepDiffs.length ? Math.max(...headingStepDiffs) : null;

    const headerOverlapDetected = clearanceFromHeader !== null && clearanceFromHeader < 24;
    const footerCrowdedDetected = contentToFooterGap !== null && contentToFooterGap < 32;
    const inconsistentVerticalRhythmDetected = minStep !== null && maxStep !== null ? maxStep - minStep > 48 : false;

    const recommendations: string[] = [];
    if (headerOverlapDetected) {
      recommendations.push('Increase top spacing below header to at least 24px.');
    }
    if (footerCrowdedDetected) {
      recommendations.push('Increase bottom spacing before footer to at least 32px.');
    }
    if (inconsistentVerticalRhythmDetected) {
      recommendations.push('Normalize section spacing so heading gaps are visually consistent.');
    }

    return {
      version: '1.0',
      route,
      document: {
        title: compactText(doc.title || '', 180),
      },
      viewport: {
        width: win.innerWidth,
        height: win.innerHeight,
        scrollY: Math.round(win.scrollY || 0),
      },
      content: {
        h1,
        headings,
        paragraphs,
      },
      interactive: {
        buttons,
        links,
      },
      layout: {
        header: {
          position: headerElement ? win.getComputedStyle(headerElement).position : 'unknown',
          heightPx: headerRect ? Math.round(headerRect.height) : null,
          bottomPx: headerBottom,
        },
        main: {
          firstHeadingTopPx: firstHeadingTop,
          clearanceFromHeaderPx: clearanceFromHeader,
        },
        footer: {
          footerTopPx: footerTop,
          lastContentBottomPx: lastContentBottom,
          contentToFooterGapPx: contentToFooterGap,
        },
        spacing: {
          headingToParagraphGapPx: headingToParagraphGap,
          sectionToSectionGapPx: sectionGap,
        },
        flags: {
          headerOverlapDetected,
          footerCrowdedDetected,
          inconsistentVerticalRhythmDetected,
        },
        recommendations: recommendations.slice(0, 3),
      },
      diagnostics: {
        capturedAt: new Date().toISOString(),
      },
    };
  } catch {
    return null;
  }
}

function toSnapshotTextPart(
  snapshot: BuilderPreviewSnapshot | null,
): Extract<UserContent[number], { type: 'text' }> | null {
  if (!snapshot) {
    return null;
  }

  return {
    type: 'text',
    text: `${SNAPSHOT_MARKER_START}\n${JSON.stringify(snapshot, null, 2)}\n${SNAPSHOT_MARKER_END}`,
  };
}

function readPreviewRouteState(frame: HTMLIFrameElement | null): PreviewRouteState | undefined {
  try {
    const location = frame?.contentWindow?.location;
    if (!location) {
      return undefined;
    }

    const hash = location.hash || '';
    const hashPath = hash.startsWith('#/') ? hash.slice(1) : '';
    const fallbackPath = '/';

    return {
      // srcDoc iframes expose internal paths (e.g. /srcdoc) that are not app routes.
      // Persist only hash-based app routes; otherwise default to root.
      path: hashPath || fallbackPath,
      hash,
      query: hashPath ? location.search || '' : '',
    };
  } catch {
    return undefined;
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export const BuilderTenant = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { tenant: tenantName } = useParams<{ tenant: string }>();

  const config = useSelector((state: AppState) => state.config);
  const configInitialized = useSelector(configInitializedSelector);
  const tenant = useSelector(tenantSelector);
  const user = useSelector(userSelector);
  const userInitialized = useSelector((state: AppState) => state.user.initialized);

  const [threadId, setThreadId] = useState('');
  const messages = useSelector((state: AppState) => agentMessagesByThreadSelector(state, threadId));
  const connectionStatus = useSelector(agentConnectionStatusSelector);
  const workspaceStatus = useSelector(agentWorkspaceStatusSelector);
  const isWorkspaceRefreshing = useSelector(agentWorkspaceRefreshingSelector);
  const selectedAssetThumbnail = useSelector(agentSelectedAssetThumbnailSelector);
  const [files, setFiles] = useState<WorkspaceFileMap>({});
  const [selectedPath, setSelectedPath] = useState(DEFAULT_SELECTED_FILE);
  const isSocketConnected = useSelector(agentSocketConnectedSelector);
  const [workspaceRevision, setWorkspaceRevision] = useState<number | undefined>();
  const [recentlyUpdatedPaths, setRecentlyUpdatedPaths] = useState<Record<string, number>>({});
  const [isWorkspaceEmpty, setIsWorkspaceEmpty] = useState(false);
  const isWorkspaceSaving = useSelector(projectIsSavingSelector);

  const socketRef = useRef<Socket | null>(null);
  const seededWorkspaceRef = useRef(false);
  const autoLoadAttemptedRef = useRef(false);
  const selectedPathRef = useRef(DEFAULT_SELECTED_FILE);
  const workspaceInitInProgressRef = useRef(false);
  const updateIndicatorTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const reconnectTimerRef = useRef<number | null>(null);
  const workspaceReadRetryTimerRef = useRef<number | null>(null);
  const workspaceReadRetryAttemptsRef = useRef(0);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const previewRouteStateRef = useRef<PreviewRouteState | undefined>(undefined);

  const agentServiceUrl = config.environment.agentServiceUrl || config.directory['urn:ads:platform:agent-service'];
  const previewDocument = useMemo(() => createFallbackPreviewDocument(files, previewRouteStateRef.current), [files]);

  useEffect(() => {
    if (configInitialized && tenantName) {
      dispatch(initializeTenant(tenantName));
      const searchParams = new URLSearchParams(location.search);
      const projectId = searchParams.get('projectId')?.trim();

      if (projectId) {
        // Use projectId directly as thread ID
        setThreadId(projectId);
      } else {
        // Generate a project context and persist it in the URL so reload restores the same thread.
        const newProjectId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        searchParams.set('projectId', newProjectId);
        const nextSearch = searchParams.toString();
        window.history.replaceState(
          window.history.state,
          '',
          `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`,
        );
        setThreadId(newProjectId);
      }
    }
  }, [configInitialized, dispatch, tenantName, location.search]);

  useEffect(() => {
    // Clean hash after sign-in redirect (but allow GoabTabs hashes during normal usage)
    if (user && window.location.hash) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
  }, [user]);

  useEffect(() => {
    selectedPathRef.current = selectedPath;
  }, [selectedPath]);

  useEffect(() => {
    if (isImagePath(selectedPath) && files[selectedPath]) {
      dispatch(agentActions.setSelectedAssetThumbnail({ path: selectedPath, dataUrl: files[selectedPath] }));
    } else {
      dispatch(agentActions.setSelectedAssetThumbnail(null));
    }
  }, [dispatch, selectedPath, files]);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (workspaceReadRetryTimerRef.current !== null) {
        window.clearTimeout(workspaceReadRetryTimerRef.current);
        workspaceReadRetryTimerRef.current = null;
      }
      socketRef.current?.disconnect();
      for (const timeout of Object.values(updateIndicatorTimeoutsRef.current)) {
        clearTimeout(timeout);
      }
      updateIndicatorTimeoutsRef.current = {};
    };
  }, []);

  const markFilesAsRecentlyUpdated = (paths: string[]) => {
    const normalizedPaths = [...new Set(paths.map((path) => normalizeWorkspacePath(path)).filter(Boolean))];
    if (!normalizedPaths.length) {
      return;
    }

    const now = Date.now();
    setRecentlyUpdatedPaths((current) => {
      const next = { ...current };
      for (const path of normalizedPaths) {
        next[path] = now;
      }
      return next;
    });

    for (const path of normalizedPaths) {
      const existingTimeout = updateIndicatorTimeoutsRef.current[path];
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      updateIndicatorTimeoutsRef.current[path] = setTimeout(() => {
        setRecentlyUpdatedPaths((current) => {
          if (!(path in current)) {
            return current;
          }

          const next = { ...current };
          delete next[path];
          return next;
        });
        delete updateIndicatorTimeoutsRef.current[path];
      }, RECENT_FILE_UPDATE_MS);
    }
  };

  useEffect(() => {
    if (!configInitialized || !tenant || !user || !threadId) {
      dispatch(agentActions.resetSessionState());
    }
  }, [configInitialized, dispatch, tenant, threadId, user]);

  useEffect(() => {
    if (!configInitialized || !tenant || !user || !threadId) {
      return;
    }

    if (!agentServiceUrl) {
      dispatch(agentActions.setConnectionStatus('Agent service URL not found in directory'));
      return;
    }

    let active = true;
    let socket: Socket | null = null;

    const connect = async () => {
      const clearWorkspaceReadRetry = () => {
        if (workspaceReadRetryTimerRef.current !== null) {
          window.clearTimeout(workspaceReadRetryTimerRef.current);
          workspaceReadRetryTimerRef.current = null;
        }
      };

      const requestWorkspaceRead = (status?: string) => {
        if (!socket?.connected) {
          return;
        }

        if (status) {
          dispatch(agentActions.setWorkspaceStatus(status));
        }

        socket.emit('workspace-read', { agent: BUILDER_AGENT_ID, threadId });
      };

      const scheduleWorkspaceReadRetry = () => {
        if (!workspaceInitInProgressRef.current || workspaceReadRetryTimerRef.current !== null) {
          return;
        }

        workspaceReadRetryTimerRef.current = window.setTimeout(() => {
          workspaceReadRetryTimerRef.current = null;

          if (!workspaceInitInProgressRef.current || !socket?.connected) {
            return;
          }

          workspaceReadRetryAttemptsRef.current += 1;
          if (workspaceReadRetryAttemptsRef.current > 8) {
            workspaceInitInProgressRef.current = false;
            dispatch(agentActions.setWorkspaceRefreshing(false));
            dispatch(agentActions.setWorkspaceStatus('Workspace sync timed out; retrying snapshot read'));
            requestWorkspaceRead();
            return;
          }

          requestWorkspaceRead('Workspace initialization in progress');
          scheduleWorkspaceReadRetry();
        }, 1500);
      };

      const scheduleReconnect = (delayMs = 1500) => {
        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
        }

        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          const activeSocket = socketRef.current;
          if (activeSocket && !activeSocket.connected) {
            activeSocket.connect();
          }
        }, delayMs);
      };

      const namespaceUrl = new URL(`/${tenantName ?? tenant.name}`, agentServiceUrl).toString();
      socket = io(namespaceUrl, {
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: async (cb) => {
          try {
            const token = await getAccessToken(dispatch, tenant.realm, config);
            cb(token ? { token } : null);
          } catch {
            cb(null);
          }
        },
        transports: ['websocket'],
      });
      socketRef.current = socket;
      seededWorkspaceRef.current = false;
      autoLoadAttemptedRef.current = false;
      clearWorkspaceReadRetry();
      workspaceReadRetryAttemptsRef.current = 0;

      socket.on('connect', () => {
        dispatch(agentActions.setSocketConnected(true));
        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        dispatch(agentActions.setConnectionStatus('Connected to builder agent'));
        requestWorkspaceRead('Reading workspace from agent');
      });

      socket.on('disconnect', (reason) => {
        dispatch(agentActions.setSocketConnected(false));
        dispatch(agentActions.setConnectionStatus(`Disconnected: ${reason}`));

        // Server-initiated disconnects do not auto-reconnect.
        if (reason === 'io server disconnect') {
          scheduleReconnect();
        }
      });

      socket.on('connect_error', () => {
        dispatch(agentActions.setSocketConnected(false));
        dispatch(agentActions.setConnectionStatus('Connection lost; retrying'));
      });

      socket.on('session-expired', () => {
        dispatch(agentActions.setSocketConnected(false));
        dispatch(agentActions.setConnectionStatus('Session expired; reconnecting with refreshed token'));
        scheduleReconnect(250);
      });

      socket.on('error', (message: string) => {
        clearWorkspaceReadRetry();
        workspaceReadRetryAttemptsRef.current = 0;
        workspaceInitInProgressRef.current = false;
        dispatch(agentActions.setWorkspaceRefreshing(false));
        dispatch(agentActions.setWorkspaceStatus(`Agent error: ${message}`));
      });

      socket.on('workspace-state', ({ revision, files: nextFiles }: WorkspaceStateEvent) => {
        dispatch(agentActions.setWorkspaceRefreshing(false));
        if (!nextFiles.length && workspaceInitInProgressRef.current) {
          // Don't poll workspace-read during init — wait for workspace-ready event
          dispatch(agentActions.setWorkspaceStatus('Workspace initialization in progress'));
          return;
        }

        if (!nextFiles.length && !seededWorkspaceRef.current) {
          seededWorkspaceRef.current = true;

          // Attempt to auto-restore from the last saved project snapshot
          if (!autoLoadAttemptedRef.current && threadId) {
            autoLoadAttemptedRef.current = true;
            dispatch(lookupProjectSnapshot({ threadId }))
              .then((result) => {
                const fileId = typeof result.payload === 'string' ? result.payload : null;
                if (fileId) {
                  const urn = `urn:ads:platform:file-service:v1:/files/${fileId}`;
                  workspaceInitInProgressRef.current = true;
                  workspaceReadRetryAttemptsRef.current = 0;
                  socketRef.current?.emit('workspace-init', {
                    agent: BUILDER_AGENT_ID,
                    threadId,
                    workspaceTarball: urn,
                  });
                  // Don't poll workspace-read during init — wait for workspace-ready event
                  dispatch(agentActions.setWorkspaceStatus('Restoring workspace from last saved snapshot'));
                } else {
                  clearWorkspaceReadRetry();
                  setIsWorkspaceEmpty(true);
                  dispatch(agentActions.setWorkspaceStatus('Workspace is empty'));
                }
              })
              .catch(() => {
                clearWorkspaceReadRetry();
                setIsWorkspaceEmpty(true);
                dispatch(agentActions.setWorkspaceStatus('Workspace is empty'));
              });
          } else {
            clearWorkspaceReadRetry();
            setIsWorkspaceEmpty(true);
            dispatch(agentActions.setWorkspaceStatus('Workspace is empty'));
          }
          return;
        }

        clearWorkspaceReadRetry();
        workspaceReadRetryAttemptsRef.current = 0;
        workspaceInitInProgressRef.current = false;
        setIsWorkspaceEmpty(false);
        previewRouteStateRef.current = readPreviewRouteState(previewFrameRef.current);
        const snapshot = applyWorkspaceSnapshot(nextFiles);
        startTransition(() => {
          setFiles(snapshot);
          setSelectedPath((current) => (snapshot[current] ? current : getDefaultSelectedPath(snapshot)));
        });
        setWorkspaceRevision(revision);
        dispatch(agentActions.setWorkspaceStatus(`Workspace synchronized (${nextFiles.length} files)`));
      });

      socket.on('workspace-updated', ({ revision, writeCount, deleteCount }) => {
        clearWorkspaceReadRetry();
        workspaceReadRetryAttemptsRef.current = 0;
        workspaceInitInProgressRef.current = false;
        dispatch(agentActions.setWorkspaceRefreshing(false));
        setIsWorkspaceEmpty(false);
        setWorkspaceRevision(revision);
        dispatch(agentActions.setWorkspaceStatus(`Workspace updated: ${writeCount} writes, ${deleteCount} deletes`));
        requestWorkspaceRead();
      });

      socket.on('workspace-ready', ({ revision }) => {
        clearWorkspaceReadRetry();
        workspaceReadRetryAttemptsRef.current = 0;
        dispatch(agentActions.setWorkspaceRefreshing(false));
        setIsWorkspaceEmpty(false);
        setWorkspaceRevision(revision);
        dispatch(agentActions.setWorkspaceStatus('Workspace initialized; reading snapshot'));
        requestWorkspaceRead();
      });

      socket.on('workspace-change', (change: WorkspaceChangeEvent) => {
        dispatch(agentActions.setWorkspaceRefreshing(false));
        if (change.writes.some(({ content }) => content === undefined)) {
          requestWorkspaceRead();
          return;
        }

        previewRouteStateRef.current = readPreviewRouteState(previewFrameRef.current);
        startTransition(() => {
          setFiles((current) => {
            const next = applyWorkspaceChange(current, change);
            if (!next[selectedPathRef.current]) {
              setSelectedPath(getDefaultSelectedPath(next));
            }
            return next;
          });
        });
        markFilesAsRecentlyUpdated(change.writes.map((write) => write.path));
        setWorkspaceRevision((current) => change.revision ?? current);
        dispatch(agentActions.setWorkspaceStatus(`Agent changed workspace via ${change.toolName ?? 'workspace tool'}`));
      });

      socket.on('stream', (event: BuilderAgentStreamEvent) => {
        if (event.content || event.chunk || event.done || event.output !== undefined) {
          dispatch(agentActions.applyStreamEvent({ threadId, event }));
        }
      });
    };

    void connect();

    return () => {
      active = false;
      if (workspaceReadRetryTimerRef.current !== null) {
        window.clearTimeout(workspaceReadRetryTimerRef.current);
        workspaceReadRetryTimerRef.current = null;
      }
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socket?.disconnect();
      dispatch(agentActions.setSocketConnected(false));
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [agentServiceUrl, config, configInitialized, dispatch, tenant, tenantName, threadId, user]);

  const handleInitFromTarball = useCallback(
    (uuid: string) => {
      const normalizedUuid = uuid.trim();
      if (!socketRef.current || !normalizedUuid) {
        return;
      }

      const urn = `urn:ads:platform:file-service:v1:/files/${normalizedUuid}`;
      workspaceInitInProgressRef.current = true;
      setIsWorkspaceEmpty(false);
      socketRef.current.emit('workspace-init', {
        agent: BUILDER_AGENT_ID,
        threadId,
        workspaceTarball: urn,
      });
      dispatch(agentActions.setWorkspaceStatus('Initializing workspace from tarball'));
    },
    [dispatch, threadId],
  );

  const handleSignOut = useCallback(() => {
    if (!tenant) {
      return;
    }

    dispatch(logoutUser({ tenant, from: location.pathname }));
  }, [dispatch, location.pathname, tenant]);

  const handleSendPrompt = (_threadId: string, context: Record<string, unknown>, content: UserContent) => {
    if (!content.length || !socketRef.current) {
      return;
    }

    const text = content
      .filter((part): part is Extract<UserContent[number], { type: 'text' }> => part.type === 'text')
      .map((part) => part.text)
      .join('\n\n')
      .trim();

    if (!text) {
      return;
    }

    const messageId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    dispatch(
      agentActions.initializeMessage({
        id: messageId,
        threadId,
        from: 'user',
        content: [{ type: 'text', text }],
      }),
    );

    const snapshot = capturePreviewSnapshot(previewFrameRef.current);
    const snapshotPart = toSnapshotTextPart(snapshot);
    const outboundContent = snapshotPart ? [...content, snapshotPart] : content;

    socketRef.current.emit('message', {
      agent: BUILDER_AGENT_ID,
      threadId,
      messageId,
      content: outboundContent,
      context,
      rawChunks: true,
    });
  };

  const handleRefreshWorkspace = () => {
    dispatch(agentActions.setWorkspaceRefreshing(true));
    socketRef.current?.emit('workspace-read', { agent: BUILDER_AGENT_ID, threadId });
    dispatch(agentActions.setWorkspaceStatus('Refreshing workspace snapshot'));
  };

  const handleDownloadWorkspace = useCallback(() => {
    const snapshot = sortWorkspaceFiles(files);
    if (!snapshot.length) {
      dispatch(agentActions.setWorkspaceStatus('Workspace is empty; nothing to download'));
      return;
    }

    const archive = createTarArchive(snapshot);
    const datePart = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
    const threadSuffix = threadId ? `-${threadId.slice(0, 8)}` : '';
    const fileName = `workspace${threadSuffix}-${datePart}.tar`;

    downloadBlob(archive, fileName);
    dispatch(agentActions.setWorkspaceStatus(`Downloaded workspace (${snapshot.length} files)`));
  }, [dispatch, files, threadId]);

  const handleSaveWorkspace = useCallback(async () => {
    if (isWorkspaceSaving || !socketRef.current || !threadId) {
      return;
    }

    const socket = socketRef.current;
    let refreshedFiles: WorkspaceSnapshotFile[];
    try {
      refreshedFiles = await new Promise<WorkspaceSnapshotFile[]>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          socket.off('workspace-state', onWorkspaceState);
          reject(new Error('Timed out waiting for workspace snapshot'));
        }, 5000);

        const onWorkspaceState = ({ files: nextFiles }: WorkspaceStateEvent) => {
          window.clearTimeout(timeout);
          socket.off('workspace-state', onWorkspaceState);
          resolve(nextFiles ?? []);
        };

        socket.on('workspace-state', onWorkspaceState);
        socket.emit('workspace-read', { agent: BUILDER_AGENT_ID, threadId });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch(agentActions.setWorkspaceStatus(`Workspace save failed: ${message}`));
      return;
    }

    const snapshot = sortWorkspaceFiles(applyWorkspaceSnapshot(refreshedFiles));
    if (!snapshot.length) {
      dispatch(agentActions.setWorkspaceStatus('Workspace is empty; nothing to save'));
      return;
    }

    dispatch(saveWorkspaceToFileService({ files: snapshot, threadId })).then((result) => {
      if (saveWorkspaceToFileService.rejected.match(result)) {
        dispatch(agentActions.setWorkspaceStatus(`Workspace save failed: ${result.error.message ?? 'Unknown error'}`));
      }
    });
  }, [dispatch, isWorkspaceSaving, threadId]);

  if (!userInitialized && tenant) {
    return null;
  }

  if (!user && tenant) {
    return (
      <Page>
        <Band title="Sign in to continue">Sign in to launch the live workspace.</Band>
        <Container vs={3} hs={1}>
          <Grid>
            <GridItem md={1} />
            <GridItem md={10}>
              <SignInPanel>
                <EmptyState>
                  <GoabCallout type="information" heading="Builder prototype access">
                    This prototype uses your tenant-scoped token to connect directly to the agent-service Socket.IO
                    endpoint.
                  </GoabCallout>
                  <PanelSubtle>Tenant: {tenant.name}</PanelSubtle>
                  <GoabButtonGroup alignment="end">
                    <GoabButton
                      type="primary"
                      onClick={() => dispatch(loginUser({ tenant, from: `${location.pathname}${location.search}` }))}
                    >
                      Sign in
                    </GoabButton>
                  </GoabButtonGroup>
                </EmptyState>
              </SignInPanel>
            </GridItem>
            <GridItem md={1} />
          </Grid>
        </Container>
      </Page>
    );
  }

  const sortedFiles = sortWorkspaceFiles(files);
  const selectedFileContent = files[selectedPath] ?? '';
  return (
    <Page>
      <Shell>
        <PrimaryPreviewViewport>
          <PreviewViewportFrame ref={previewFrameRef} srcDoc={previewDocument} title="Builder preview" />
        </PrimaryPreviewViewport>
      </Shell>
      <BuilderEditPane
        threadId={threadId}
        isSocketConnected={isSocketConnected}
        connectionStatus={connectionStatus}
        workspaceStatus={workspaceStatus}
        tenantLabel={tenant?.name ?? tenantName ?? 'Unknown'}
        userEmail={user?.email}
        canSignOut={Boolean(user && tenant)}
        messages={messages}
        onSendPrompt={handleSendPrompt}
        onSignOut={handleSignOut}
        isWorkspaceEmpty={isWorkspaceEmpty}
        sortedFiles={sortedFiles}
        selectedPath={selectedPath}
        selectedFileContent={selectedFileContent}
        selectedAssetThumbnail={selectedAssetThumbnail}
        recentlyUpdatedPaths={recentlyUpdatedPaths}
        workspaceRevision={workspaceRevision}
        isWorkspaceRefreshing={isWorkspaceRefreshing}
        isWorkspaceSaving={isWorkspaceSaving}
        onSelectPath={setSelectedPath}
        onInitFromTarball={handleInitFromTarball}
        onDownloadWorkspace={handleDownloadWorkspace}
        onSaveWorkspace={handleSaveWorkspace}
        onRefreshWorkspace={handleRefreshWorkspace}
      />
    </Page>
  );
};

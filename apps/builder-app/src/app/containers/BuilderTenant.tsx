import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { AgentChat, Band, Container, Grid, GridItem, type UserContent } from '@core-services/app-common';
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
import {
  AppDispatch,
  AppState,
  agentActions,
  agentConnectionStatusSelector,
  agentMessagesByThreadSelector,
  agentSocketConnectedSelector,
  agentWorkspaceRefreshingSelector,
  agentWorkspaceStatusSelector,
  type BuilderAgentStreamEvent,
  configInitializedSelector,
  getAccessToken,
  initializeTenant,
  loginUser,
  logoutUser,
  tenantSelector,
  userSelector,
} from '../state';
import {
  applyWorkspaceChange,
  applyWorkspaceSnapshot,
  BUILDER_AGENT_ID,
  DEFAULT_SELECTED_FILE,
  getDefaultSelectedPath,
  sortWorkspaceFiles,
  type WorkspaceChangeEvent,
  type WorkspaceFileMap,
  type WorkspaceSnapshotFile,
} from '../lib/builderWorkspace';
import { createFallbackPreviewDocument, type PreviewRouteState } from '../lib/builderPreview';
import styles from './BuilderTenant.module.scss';

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

function writeTarString(target: Uint8Array, offset: number, size: number, value: string): void {
  const bytes = new TextEncoder().encode(value);
  const length = Math.min(bytes.length, size);
  target.set(bytes.slice(0, length), offset);
}

function writeTarOctal(target: Uint8Array, offset: number, size: number, value: number): void {
  const octal = Math.max(0, Math.floor(value)).toString(8);
  const bodyLength = Math.max(0, size - 1);
  const body = octal.padStart(bodyLength, '0').slice(-bodyLength);
  writeTarString(target, offset, bodyLength, body);
  target[offset + size - 1] = 0;
}

function normalizeTarPath(path: string): { name: string; prefix: string } {
  const normalized = normalizeWorkspacePath(path).replace(/^\/+/, '');

  if (normalized.length <= 100) {
    return { name: normalized, prefix: '' };
  }

  const splitIndex = normalized.lastIndexOf('/');
  if (splitIndex > 0) {
    const prefix = normalized.slice(0, splitIndex);
    const name = normalized.slice(splitIndex + 1);
    if (name.length <= 100 && prefix.length <= 155) {
      return { name, prefix };
    }
  }

  // Fallback: keep tail segment if path cannot fit ustar split constraints.
  return {
    name: normalized.slice(-100),
    prefix: '',
  };
}

function createTarArchive(files: WorkspaceSnapshotFile[]): Blob {
  const encoder = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);
  const chunks: Uint8Array[] = [];

  for (const file of files) {
    const { name, prefix } = normalizeTarPath(file.path);
    const content = encoder.encode(file.content ?? '');
    const header = new Uint8Array(512);

    writeTarString(header, 0, 100, name);
    writeTarOctal(header, 100, 8, 0o644);
    writeTarOctal(header, 108, 8, 0);
    writeTarOctal(header, 116, 8, 0);
    writeTarOctal(header, 124, 12, content.length);
    writeTarOctal(header, 136, 12, now);

    // Checksum field must be initialized to spaces before checksum is computed.
    for (let index = 148; index < 156; index++) {
      header[index] = 0x20;
    }

    header[156] = '0'.charCodeAt(0);
    writeTarString(header, 257, 6, 'ustar');
    writeTarString(header, 263, 2, '00');
    writeTarString(header, 345, 155, prefix);

    const checksum = header.reduce((sum, value) => sum + value, 0);
    const checksumOctal = checksum.toString(8).padStart(6, '0').slice(-6);
    writeTarString(header, 148, 6, checksumOctal);
    header[154] = 0;
    header[155] = 0x20;

    chunks.push(header);
    chunks.push(content);

    const remainder = content.length % 512;
    if (remainder !== 0) {
      chunks.push(new Uint8Array(512 - remainder));
    }
  }

  // End-of-archive marker: two empty 512-byte blocks.
  chunks.push(new Uint8Array(1024));
  return new Blob(chunks as unknown as BlobPart[], { type: 'application/x-tar' });
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
  const [files, setFiles] = useState<WorkspaceFileMap>({});
  const [selectedPath, setSelectedPath] = useState(DEFAULT_SELECTED_FILE);
  const [workspaceView, setWorkspaceView] = useState<'list' | 'file'>('list');
  const [activePanelTab, setActivePanelTab] = useState<'chat' | 'workspace' | 'info'>('chat');
  const [isEditPaneCollapsed, setIsEditPaneCollapsed] = useState(false);
  const isSocketConnected = useSelector(agentSocketConnectedSelector);
  const [workspaceRevision, setWorkspaceRevision] = useState<number | undefined>();
  const [recentlyUpdatedPaths, setRecentlyUpdatedPaths] = useState<Record<string, number>>({});
  const [isWorkspaceEmpty, setIsWorkspaceEmpty] = useState(false);
  const [tarballUrnInput, setTarballUrnInput] = useState('');
  const [showTarballForm, setShowTarballForm] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const seededWorkspaceRef = useRef(false);
  const selectedPathRef = useRef(DEFAULT_SELECTED_FILE);
  const workspaceInitInProgressRef = useRef(false);
  const updateIndicatorTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const reconnectTimerRef = useRef<number | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const previewRouteStateRef = useRef<PreviewRouteState | undefined>(undefined);

  const agentServiceUrl = config.environment.agentServiceUrl || config.directory['urn:ads:platform:agent-service'];
  const previewDocument = useMemo(() => createFallbackPreviewDocument(files, previewRouteStateRef.current), [files]);

  useEffect(() => {
    if (configInitialized && tenantName) {
      dispatch(initializeTenant(tenantName));
      const searchParams = new URLSearchParams(location.search);
      const projectId = searchParams.get('projectId');

      if (projectId) {
        // Use projectId directly as thread ID
        setThreadId(projectId);
      } else {
        // Generate a new thread ID for this session (no persistence)
        const newThreadId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setThreadId(newThreadId);
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
    return () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
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

      socket.on('connect', () => {
        dispatch(agentActions.setSocketConnected(true));
        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        dispatch(agentActions.setConnectionStatus('Connected to builder agent'));
        dispatch(agentActions.setWorkspaceStatus('Reading workspace from agent'));
        socket?.emit('workspace-read', { agent: BUILDER_AGENT_ID, threadId });
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
        workspaceInitInProgressRef.current = false;
        dispatch(agentActions.setWorkspaceRefreshing(false));
        dispatch(agentActions.setWorkspaceStatus(`Agent error: ${message}`));
      });

      socket.on('workspace-state', ({ revision, files: nextFiles }: WorkspaceStateEvent) => {
        dispatch(agentActions.setWorkspaceRefreshing(false));
        if (!nextFiles.length && workspaceInitInProgressRef.current) {
          dispatch(agentActions.setWorkspaceStatus('Workspace initialization in progress'));
          return;
        }

        if (!nextFiles.length && !seededWorkspaceRef.current) {
          seededWorkspaceRef.current = true;
          setIsWorkspaceEmpty(true);
          dispatch(agentActions.setWorkspaceStatus('Workspace is empty'));
          return;
        }

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
        workspaceInitInProgressRef.current = false;
        dispatch(agentActions.setWorkspaceRefreshing(false));
        setIsWorkspaceEmpty(false);
        setWorkspaceRevision(revision);
        dispatch(agentActions.setWorkspaceStatus(`Workspace updated: ${writeCount} writes, ${deleteCount} deletes`));
        socket?.emit('workspace-read', { agent: BUILDER_AGENT_ID, threadId });
      });

      socket.on('workspace-ready', ({ revision }) => {
        dispatch(agentActions.setWorkspaceRefreshing(false));
        setIsWorkspaceEmpty(false);
        setWorkspaceRevision(revision);
        dispatch(agentActions.setWorkspaceStatus('Workspace initialized; reading snapshot'));
        socket?.emit('workspace-read', { agent: BUILDER_AGENT_ID, threadId });
      });

      socket.on('workspace-change', (change: WorkspaceChangeEvent) => {
        dispatch(agentActions.setWorkspaceRefreshing(false));
        if (change.writes.some(({ content }) => content === undefined)) {
          socket?.emit('workspace-read', { agent: BUILDER_AGENT_ID, threadId });
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

  const handleInitFromTarball = useCallback(() => {
    const uuid = tarballUrnInput.trim();
    if (!socketRef.current || !uuid) {
      return;
    }

    const urn = `urn:ads:platform:file-service:v1:/files/${uuid}`;
    workspaceInitInProgressRef.current = true;
    setIsWorkspaceEmpty(false);
    setShowTarballForm(false);
    socketRef.current.emit('workspace-init', {
      agent: BUILDER_AGENT_ID,
      threadId,
      workspaceTarball: urn,
    });
    dispatch(agentActions.setWorkspaceStatus('Initializing workspace from tarball'));
  }, [dispatch, tarballUrnInput, threadId]);

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

  if (!userInitialized && tenant) {
    return null;
  }

  if (!user && tenant) {
    return (
      <main className={styles.page}>
        <Band title="Sign in to continue">Sign in to launch the live workspace.</Band>
        <Container vs={3} hs={1}>
          <Grid>
            <GridItem md={1} />
            <GridItem md={10}>
              <section className={`${styles.panel} ${styles.signInPanel}`}>
                <div className={styles.emptyState}>
                  <GoabCallout type="information" heading="Builder prototype access">
                    This prototype uses your tenant-scoped token to connect directly to the agent-service Socket.IO
                    endpoint.
                  </GoabCallout>
                  <p className={styles.panelSubtle}>Tenant: {tenant.name}</p>
                  <GoabButtonGroup alignment="end">
                    <GoabButton type="primary" onClick={() => dispatch(loginUser({ tenant, from: location.pathname }))}>
                      Sign in
                    </GoabButton>
                  </GoabButtonGroup>
                </div>
              </section>
            </GridItem>
            <GridItem md={1} />
          </Grid>
        </Container>
      </main>
    );
  }

  const sortedFiles = sortWorkspaceFiles(files);
  const selectedFileContent = files[selectedPath] ?? '';
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <section className={styles.primaryPreviewViewport}>
          <iframe
            ref={previewFrameRef}
            className={styles.previewViewportFrame}
            srcDoc={previewDocument}
            title="Builder preview"
          />
        </section>
      </section>

      {isEditPaneCollapsed ? (
        <div className={styles.panelLauncher}>
          <GoabIconButton
            icon="chevron-up"
            variant="dark"
            size="medium"
            ariaLabel="Open edit pane"
            onClick={() => setIsEditPaneCollapsed(false)}
          />
        </div>
      ) : (
        <section id="builder-edit-pane" className={`${styles.panel} ${styles.floatingPanel}`}>
          <header className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Agent interaction</h2>
              <p className={styles.panelSubtle}>{activePanelTab === 'chat' ? connectionStatus : workspaceStatus}</p>
            </div>
            <div className={styles.panelHeaderActions}>
              <div className={styles.panelCollapseButton}>
                <GoabIconButton
                  icon="chevron-down"
                  variant="nocolor"
                  size="medium"
                  ariaLabel="Hide panel"
                  onClick={() => setIsEditPaneCollapsed(true)}
                />
              </div>
            </div>
          </header>

          <div className={styles.tabContainer}>
            <GoabTabs
              initialTab={1}
              onChange={(event: GoabTabsOnChangeDetail) => {
                if (event.tab === 2) setActivePanelTab('workspace');
                else if (event.tab === 3) setActivePanelTab('info');
                else setActivePanelTab('chat');
              }}
              data-testid="builder-edit-pane-tabs"
            >
              <GoabTab heading="Chat" data-testid="builder-chat-tab" />
              <GoabTab heading="Workspace" data-testid="builder-workspace-tab" />
              <GoabTab heading="Session info" data-testid="builder-info-tab" />
            </GoabTabs>

            <div className={styles.tabContentArea}>
              {activePanelTab === 'chat' ? (
                <div className={styles.chatPane}>
                  <AgentChat
                    disabled={!threadId || !isSocketConnected}
                    threadId={threadId}
                    context={{ tenant: tenant?.name ?? tenantName }}
                    messages={messages}
                    onSend={handleSendPrompt}
                  />
                </div>
              ) : activePanelTab === 'info' ? (
                <div className={styles.infoPaneBody}>
                  <div>
                    <p className={styles.panelLabel}>Tenant</p>
                    <p className={styles.panelValue}>{tenant?.name ?? tenantName ?? 'Unknown'}</p>
                  </div>
                  <div>
                    <p className={styles.panelLabel}>Signed in</p>
                    <p className={styles.panelValue}>{user?.email ?? 'Not signed in'}</p>
                  </div>
                  <div>
                    <p className={styles.panelLabel}>Thread</p>
                    <p className={styles.panelValue}>{threadId || 'Pending'}</p>
                  </div>
                  <div className={styles.actions}>
                    {user && tenant ? (
                      <GoabButton
                        type="secondary"
                        size="compact"
                        onClick={() => dispatch(logoutUser({ tenant, from: location.pathname }))}
                      >
                        Sign out
                      </GoabButton>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className={styles.workspaceTabPane}>
                  {isWorkspaceEmpty ? (
                    <div className={styles.emptyWorkspaceState}>
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
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                            Full URN:{' '}
                            <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>
                              urn:ads:platform:file-service:v1:/files/{tarballUrnInput || '...'}
                            </code>
                          </div>
                        </div>
                      </GoabFormItem>
                      <GoabButtonGroup alignment="end">
                        <GoabButton
                          type="primary"
                          size="compact"
                          disabled={!tarballUrnInput.trim() || !isSocketConnected}
                          onClick={handleInitFromTarball}
                        >
                          Initialize workspace
                        </GoabButton>
                      </GoabButtonGroup>
                    </div>
                  ) : (
                    <>
                      <div className={styles.workspacePaneBody}>
                        <div className={styles.workspaceTopBar}>
                          {workspaceView === 'file' ? (
                            <nav className={styles.workspaceBreadcrumb} aria-label="Workspace file navigation">
                              <button className={styles.breadcrumbLink} onClick={() => setWorkspaceView('list')}>
                                Workspace files
                              </button>
                              <span className={styles.breadcrumbDivider}>/</span>
                              <span className={styles.breadcrumbCurrent}>{selectedPath}</span>
                            </nav>
                          ) : (
                            <div className={styles.workspacePaneMeta}>
                              <p className={styles.panelSubtle}>{sortedFiles.length} synchronized file(s)</p>
                              <GoabBadge
                                type="information"
                                icon={false}
                                content={
                                  workspaceRevision !== undefined ? `Revision r${workspaceRevision}` : 'No revision'
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className={styles.workspaceStage}>
                          <div
                            className={`${styles.workspaceView} ${
                              workspaceView === 'list' ? styles.workspaceViewActive : styles.workspaceViewHidden
                            }`}
                          >
                            <ul className={styles.fileList}>
                              {sortedFiles.map((file) => (
                                <li key={file.path}>
                                  <button
                                    className={`${styles.fileButton} ${selectedPath === file.path ? styles.fileButtonActive : ''} ${
                                      recentlyUpdatedPaths[file.path] ? styles.fileButtonUpdated : ''
                                    }`}
                                    onClick={() => {
                                      setSelectedPath(file.path);
                                      setWorkspaceView('file');
                                    }}
                                  >
                                    <span className={styles.filePathRow}>
                                      <span className={styles.filePath}>{file.path}</span>
                                      {recentlyUpdatedPaths[file.path] ? (
                                        <span className={styles.fileUpdateBadge} aria-label="Updated by agent">
                                          Updated
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className={styles.fileMeta}>
                                      {file.content.length.toLocaleString()} chars
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div
                            className={`${styles.workspaceView} ${
                              workspaceView === 'file' ? styles.workspaceViewActive : styles.workspaceViewHidden
                            }`}
                          >
                            <pre className={styles.fileContent}>
                              <code>{selectedFileContent}</code>
                            </pre>
                          </div>
                        </div>
                      </div>

                      <div className={styles.composer}>
                        <div className={styles.stack}>
                          {showTarballForm ? (
                            <div className={styles.tarballForm}>
                              <GoabFormItem label="File ID (UUID)">
                                <div>
                                  <GoabInput
                                    name="tarball-uuid"
                                    value={tarballUrnInput}
                                    placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                                    onChange={({ value }) => setTarballUrnInput(value)}
                                    width="100%"
                                  />
                                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                    Full URN:{' '}
                                    <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>
                                      urn:ads:platform:file-service:v1:/files/{tarballUrnInput || '...'}
                                    </code>
                                  </div>
                                </div>
                              </GoabFormItem>
                              <GoabButtonGroup alignment="end">
                                <GoabButton type="tertiary" size="compact" onClick={() => setShowTarballForm(false)}>
                                  Cancel
                                </GoabButton>
                                <GoabButton
                                  type="primary"
                                  size="compact"
                                  disabled={!tarballUrnInput.trim() || !isSocketConnected}
                                  onClick={handleInitFromTarball}
                                >
                                  Load workspace
                                </GoabButton>
                              </GoabButtonGroup>
                            </div>
                          ) : (
                            <div className={styles.workspaceActionBar}>
                              <GoabButtonGroup alignment="start">
                                <GoabIconButton
                                  icon="download"
                                  variant="nocolor"
                                  title="Download workspace"
                                  ariaLabel="Download workspace"
                                  size="small"
                                  onClick={handleDownloadWorkspace}
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
                              <div
                                className={`${styles.workspaceActionRefresh} ${
                                  isWorkspaceRefreshing ? styles.workspaceActionRefreshBusy : ''
                                }`}
                              >
                                <span className={styles.workspaceActionRefreshLabel} aria-live="polite">
                                  {isWorkspaceRefreshing ? 'Refreshing...' : 'Refresh'}
                                </span>
                                <GoabIconButton
                                  icon="reload"
                                  variant="nocolor"
                                  title="Refresh workspace"
                                  ariaLabel="Refresh workspace"
                                  size="small"
                                  disabled={isWorkspaceRefreshing || !isSocketConnected}
                                  onClick={handleRefreshWorkspace}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

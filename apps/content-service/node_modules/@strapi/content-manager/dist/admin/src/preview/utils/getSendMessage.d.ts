/// <reference types="react" />
import type { INTERNAL_EVENTS, PUBLIC_EVENTS } from './constants';
type MessageType = (typeof INTERNAL_EVENTS)[keyof typeof INTERNAL_EVENTS] | (typeof PUBLIC_EVENTS)[keyof typeof PUBLIC_EVENTS];
/**
 * A function factory so we can generate a new sendMessage everytime we need one.
 * We can't store and reuse a single sendMessage because it needs to have a stable identity
 * as it used in a useEffect function. And we can't rely on useCallback because we need the
 * up-to-date iframe ref, and this would make it stale (refs don't trigger callback reevaluations).
 */
export declare function getSendMessage(iframe: React.RefObject<HTMLIFrameElement> | undefined): (type: MessageType, payload?: unknown) => void;
export {};

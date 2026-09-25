import { AdspEvent } from '@abgov/adsp-event-client';
import { AdspEventProvider, useAdspEvent, useAdspEventStatus } from '@abgov/adsp-event-client/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

type RowKind = 'ok' | 'gap' | 'dup' | 'info' | 'fail';
interface Row {
  at: string;
  kind: RowKind;
  text: string;
}

const LOG_KEY = 'demo:log';
const LAST_SEQ_KEY = 'demo:last-seq';

function loadRows(): Row[] {
  try {
    return JSON.parse(sessionStorage.getItem(LOG_KEY) || '[]');
  } catch (err) {
    return [];
  }
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new Error('aborted'));
    });
  });
}

async function post(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return response.json();
}

interface Settings {
  failNext: number;
  delayMs: number;
}

function Consumer({
  settings,
  log,
  onFailConsumed,
}: {
  settings: React.MutableRefObject<Settings>;
  log: (kind: RowKind, text: string) => void;
  onFailConsumed: () => void;
}) {
  const { status } = useAdspEventStatus();
  const [item1Count, setItem1Count] = useState(0);

  useAdspEvent('demo-service:item-updated', async (event: AdspEvent, { signal, attempt }) => {
    const seq = Number(event.payload?.seq);
    if (settings.current.failNext > 0) {
      settings.current.failNext--;
      onFailConsumed();
      log('fail', `seq ${seq}: handler attempt ${attempt} failed (simulated); cursor held, will retry`);
      throw new Error('Simulated handler failure');
    }

    await sleep(settings.current.delayMs, signal);

    const lastValue = sessionStorage.getItem(LAST_SEQ_KEY);
    const last = lastValue ? Number(lastValue) : null;
    const id = event.eventId.slice(-8);
    if (last === null || seq === last + 1) {
      log('ok', `seq ${seq} handled (attempt ${attempt}, event …${id}, ${event.context?.itemId})`);
    } else if (seq <= last) {
      log('dup', `seq ${seq} delivered again (event …${id}); handler must be idempotent`);
    } else {
      log('gap', `seq ${seq} handled but seq ${last + 1}–${seq - 1} were MISSED`);
    }
    sessionStorage.setItem(LAST_SEQ_KEY, `${Math.max(seq, last ?? 0)}`);
  });

  useAdspEvent('demo-service:item-deleted', (event: AdspEvent) => {
    log('ok', `item-deleted handled (event …${event.eventId.slice(-8)})`);
  });

  // Per-hook criteria: only item-1 events.
  useAdspEvent('demo-service:item-updated', () => setItem1Count((count) => count + 1), {
    criteria: { context: { itemId: 'item-1' } },
  });

  return (
    <div className="row">
      <span>
        Client status: <span className={`status ${status}`}>{status}</span>
      </span>
      <span>item-1 handler (per-hook criteria) calls: {item1Count}</span>
    </div>
  );
}

function App() {
  const [rows, setRows] = useState<Row[]>(loadRows);
  const [online, setOnline] = useState(true);
  const [failNext, setFailNext] = useState(0);
  const [delayMs, setDelayMs] = useState(0);
  const [cursor, setCursor] = useState<string>('');
  const [server, setServer] = useState<Record<string, unknown>>({});
  const settings = useRef<Settings>({ failNext: 0, delayMs: 0 });
  settings.current.delayMs = delayMs;

  const log = useCallback((kind: RowKind, text: string) => {
    setRows((current) => {
      const next = [{ at: new Date().toLocaleTimeString(), kind, text }, ...current].slice(0, 300);
      sessionStorage.setItem(LOG_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const key = Object.keys(sessionStorage).find((k) => k.startsWith('adsp-events:'));
      setCursor(key ? `${key} = ${sessionStorage.getItem(key)}` : '(none yet)');
      try {
        setServer(await (await fetch('/dev/state')).json());
      } catch (err) {
        setServer({ error: 'harness unreachable' });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const armFailures = (count: number) => {
    settings.current.failNext = count;
    setFailNext(count);
  };

  return (
    <>
      <h1>ADSP reliable event delivery: PoC demo (CS-5398)</h1>
      <fieldset>
        <legend>Publish (via RabbitMQ, like event-service)</legend>
        <button onClick={() => post('/dev/events', { count: 1 })}>item-updated ×1</button>
        <button onClick={() => post('/dev/events', { count: 10 })}>item-updated ×10</button>
        <button onClick={() => post('/dev/events', { count: 1, duplicate: true })}>item-updated with duplicate id</button>
        <button onClick={() => post('/dev/events', { name: 'item-deleted' })}>item-deleted</button>
        <button onClick={() => post('/dev/events', { name: 'unrelated-thing' })}>event not in stream</button>
      </fieldset>
      <fieldset>
        <legend>Break things</legend>
        <button onClick={async () => log('info', `server dropped ${(await post('/dev/drop')).dropped} connection(s)`)}>
          Drop connection (server side)
        </button>
        <button
          onClick={() => {
            setOnline(!online);
            log('info', online ? 'client stopped (offline)' : 'client started (online)');
          }}
        >
          {online ? 'Go offline' : 'Go online'}
        </button>
        <button onClick={async () => log('info', `trimmed ${(await post('/dev/trim')).trimmed} buffered events (expiry)`)}>
          Expire buffer
        </button>
        <button onClick={async () => log('info', `wiped Redis keys (${(await post('/dev/wipe')).deleted})`)}>
          Wipe Redis (data loss)
        </button>
        <label>
          {' '}
          Fail next <input type="number" min={0} style={{ width: 50 }} value={failNext} onChange={(e) => armFailures(Number(e.target.value))} /> attempts
        </label>
        <label>
          {' '}
          Handler delay <input type="number" min={0} step={250} style={{ width: 70 }} value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} /> ms
        </label>
      </fieldset>
      <fieldset>
        <legend>State</legend>
        {online ? (
          <AdspEventProvider
            pushServiceUrl={window.location.origin}
            tenant="demo"
            stream="demo-updates"
            retries={3}
            retryDelayMs={500}
            reconnectDelayMs={{ min: 500, max: 5000 }}
            onResync={() => {
              sessionStorage.removeItem(LAST_SEQ_KEY);
              log('gap', 'RESYNC requested by server: missed events are unrecoverable, app would reload its state');
            }}
            onError={(event) => {
              // Given up on, not missed; don't flag the next event as a gap.
              sessionStorage.setItem(LAST_SEQ_KEY, `${event.payload?.seq}`);
              log('fail', `gave up on seq ${event.payload?.seq} after all retries; cursor advanced`);
            }}
          >
            <Consumer settings={settings} log={log} onFailConsumed={() => setFailNext(settings.current.failNext)} />
          </AdspEventProvider>
        ) : (
          <span className="status offline">stopped</span>
        )}
        <div>
          Cursor (sessionStorage): <code>{cursor}</code>
        </div>
        <div>
          Server: <code>{JSON.stringify(server)}</code>
        </div>
      </fieldset>
      <fieldset>
        <legend>
          Handler log (newest first){' '}
          <button
            onClick={() => {
              sessionStorage.removeItem(LOG_KEY);
              setRows([]);
            }}
          >
            clear
          </button>
        </legend>
        <table>
          <tbody>
            {rows.map((row, i) => (
              <tr key={rows.length - i} className={row.kind}>
                <td>{row.at}</td>
                <td>{row.kind}</td>
                <td>{row.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </fieldset>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);

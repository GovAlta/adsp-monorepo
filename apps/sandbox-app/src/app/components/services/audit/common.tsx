import { GoabCallout, GoabContainer } from '@abgov/react-components';

export function ErrorCallout({ message }: { message?: string }) {
  return message ? (
    <GoabCallout type="emergency" heading="Request failed" mt="m">
      {message}
    </GoabCallout>
  ) : null;
}

export function Json({ value }: { value: unknown }) {
  return (
    <pre
      style={{
        background: 'var(--goa-color-greyscale-100, #f1f1f1)',
        padding: '1rem',
        overflow: 'auto',
        maxHeight: '28rem',
        margin: 0,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <GoabContainer mt="l" mb="m" heading={title}>
      {children}
    </GoabContainer>
  );
}

// Responsive form layout: fields share the row evenly and wrap on narrow screens.
export function FormGrid({ children, columns = 14 }: { children: React.ReactNode; columns?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${columns}rem, 1fr))`,
        gap: '1.25rem 1.5rem',
        alignItems: 'start',
      }}
    >
      {children}
    </div>
  );
}

export const STATUS_BADGE = {
  success: 'success',
  failure: 'important',
  blocked: 'emergency',
  error: 'emergency',
} as const;

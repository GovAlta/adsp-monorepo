import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import styled from 'styled-components';

export type DialogState = 'init' | 'visible' | 'hidden';

export interface DialogProps {
  open?: boolean;
  onClose?: () => void;
}

function Dialog({ children, open, onClose }: DialogProps & { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<DialogState>('init');

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      show();
      return hide;
    }
    if (!open && state === 'visible') {
      hide();
    }
  }, [open]);

  function show() {
    setVisible(true);

    // need to perform on the next render cycle to allow the css transitions to take place
    setTimeout(() => {
      setState('visible');
      const scrollbarWidth = getScrollbarWidth();
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = scrollbarWidth + 'px';
    }, 0);
  }

  function hide() {
    setState('hidden');

    // need to perform on the next render cycle to allow the css transitions to take place
    setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = 'inherit';
      document.body.style.paddingRight = '0';
    }, 300);
  }

  function close() {
    onClose?.();
  }

  return visible ? (
    <div style={{ position: 'relative' }}>
      <DialogBackground visible={state === 'visible'} />
      <DialogContentParent onClick={close} visible={state === 'visible'}>
        {children}
      </DialogContentParent>
    </div>
  ) : null;
}

export default Dialog;

// *************************
// Exported Style Components
// *************************

export const DialogActions = styled.div`
  text-align: right;
  margin-top: 1rem;
  button {
    margin: 0;
  }

  button + button {
    margin-left: 1rem;
  }
`;

export const DialogContent = styled.div`
  min-width: 50vw;
`;

export const DialogTitle = styled.div`
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  margin-bottom: 1rem;
`;

// *************
// DialogContent
// *************

interface DialogContentParentProps {
  visible: boolean;

  onClick: () => void;
}

function DialogContentParent({
  children,
  onClick,
  visible,
}: DialogContentParentProps & { children: ReactNode }): ReactElement {
  const opacity = visible ? 1 : 0;
  const marginTop = visible ? '0' : '-2rem';
  return (
    <DialogContentLayer onClick={onClick} style={{ opacity, marginTop }}>
      <DialogContentPosition onClick={(e) => e.stopPropagation()}>{children}</DialogContentPosition>
    </DialogContentLayer>
  );
}

const DialogContentPosition = styled.div`
  max-width: 60vw;
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const DialogContentLayer = styled.div`
  transition: opacity 200ms ease-in, margin-top 200ms ease-out;
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -2rem;
`;

// ****************
// DialogBackground
// ****************

interface DialogBackgroundProps {
  visible: boolean;
}

function DialogBackground({ visible }: DialogBackgroundProps): ReactElement {
  const opacity = visible ? 1 : 0;
  return <DialogBackgroundContainer style={{ opacity }}></DialogBackgroundContainer>;
}

const DialogBackgroundContainer = styled.div`
  position: fixed;
  inset: 0;
  opacity: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: opacity 100ms ease-in;
`;

// *******
// Helpers
// *******

function getScrollbarWidth() {
  // Creating invisible container
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Removing temporary elements from the DOM
  outer.parentNode.removeChild(outer);

  return scrollbarWidth;
}

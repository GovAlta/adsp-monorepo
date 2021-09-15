import React, { useEffect, useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalTitle, GoAModalActions } from '@abgov/react-components/experimental';

interface IdleTimerProps {
  // Unit min
  checkInterval?: number;
  timeoutFn?;
  continueFn?;
}

interface ModalProps {
  timeoutFn;
  continueFn;
}

const IdleTimerModal = (props: ModalProps) => {
  const maxWaitTime = 10;
  const [count, setCount] = useState(maxWaitTime);

  setTimeout(async () => {
    setCount(count - 1);
  }, 1000);

  useEffect(() => {
    if (count === 0) {
      props.timeoutFn();
    }
  }, [count]);

  return (
    <GoAModal isOpen={true}>
      <GoAModalTitle>User Session Will Timeout in {count}s</GoAModalTitle>
      <GoAModalActions>
        <GoAButton buttonType="primary" onClick={props.continueFn}>
          Stay On Page
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};

const IdleTimer = (props: IdleTimerProps) => {
  const checkInterval = (props.checkInterval || 10) * 60000;
  let lastEventAt = Date.now();
  const [show, setShow] = useState(false);

  const updateLastEventAt = () => {
    lastEventAt = Date.now();
  };

  useEffect(() => {
    // TODO: might need to add more events
    document.onmousemove = updateLastEventAt;
    document.onkeypress = updateLastEventAt;

    setInterval(async () => {
      // Hard to capture event less than 200ms. Use second unit to compare
      const elapsed = (Date.now() - lastEventAt) / 1000 + 1;

      if (elapsed >= checkInterval / 1000 - 1) {
        setShow(true);
      }
    }, checkInterval);
  }, []);

  return show && <IdleTimerModal timeoutFn={props.timeoutFn} continueFn={props.continueFn} />;
};

export { IdleTimer };

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { GoAButton } from '@abgov/react-components';
import Dialog from './Dialog';

interface IdleTimerProps {
  // Unit min
  checkInterval?: number;
  timeoutFn?;
  continueFn?;
}

interface ModalProps {
  show: boolean;
}

// TODO: Update the style of modal based on future design. Do NOT user the modal style for other component.
const Center = styled.div`
  width: 500px;
  top: 50%;
  left: 50%;
  position: fixed;
  margin-top: -250px;
  margin-left: -250px;
  padding-left: 50px;
  padding-right: 50px;
  padding-top: 20px;
  padding-bottom: 40px;
`;

interface DialogProps {
  timeoutFn;
  continueFn;
}

const IdleTimerDialog = (props: DialogProps) => {
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
    <Center>
      <Dialog open={true}>
        <h3>User Session Will Timeout in {count}s</h3>
        <br />
        <GoAButton
          buttonType={'primary'}
          onClick={() => {
            props.continueFn();
          }}
        >
          Stay On Page
        </GoAButton>
      </Dialog>
    </Center>
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

  return show && <IdleTimerDialog timeoutFn={props.timeoutFn} continueFn={props.continueFn} />;
};

export { IdleTimer };

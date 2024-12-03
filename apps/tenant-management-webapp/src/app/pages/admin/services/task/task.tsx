import React, { FunctionComponent, useEffect, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { QueuesList } from './queue/queuesList';
import { TasksList } from './tasks/tasksList';
import { TaskOverview } from './taskOverview';
import AsideLinks from '@components/AsideLinks';
import { useSelector } from 'react-redux';
import { taskAppLoginUrlSelector } from './selectors';
import LinkCopyComponent from '@components/CopyLink/CopyLink';
import { RootState } from '@store/index';
import { useLocation } from 'react-router-dom';

export const Task: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const loginUrl = useSelector(taskAppLoginUrlSelector);
  const [openAddTask, setOpenAddTask] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);
  const location = useLocation();

  const isNavigatedFromEdit = location.state?.isNavigatedFromEdit;
  const [isNavigatedFromEditor, setIsNavigatedFromEditor] = useState(isNavigatedFromEdit);
  const searchParams = new URLSearchParams(document.location.search);

  const queues = tenantName && searchParams.get('queues');

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  useEffect(() => {
    if (isNavigatedFromEditor) {
      activateEdit(true);
    }
  }, [isNavigatedFromEditor]);

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

  return (
    <Page>
      <Main>
        <h1 data-testid="task-title">Task service</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview" data-testid="task-service-overview-tab">
            <TaskOverview
              openAddTask={openAddTask}
              setOpenAddTask={setOpenAddTask}
              setActiveEdit={activateEdit}
              setActiveIndex={setActiveIndex}
              activeEdit={activateEditState}
            />
          </Tab>
          <Tab label="Queues" data-testid="task-service-queues-tab">
            <QueuesList
              openAddTask={openAddTask}
              setOpenAddTask={setOpenAddTask}
              setActiveEdit={activateEdit}
              setActiveIndex={setActiveIndex}
              activeEdit={activateEditState}
            />
          </Tab>
          <Tab label="Tasks" data-testid="task-service-tasks-tab">
            <TasksList />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <AsideLinks serviceName="task" />
        <h3>Work on tasks</h3>
        <span>Users can view and work on tasks in queues here:</span>
        <h3>Task app link</h3>
        <LinkCopyComponent text={'Copy link'} link={loginUrl} />
      </Aside>
    </Page>
  );
};

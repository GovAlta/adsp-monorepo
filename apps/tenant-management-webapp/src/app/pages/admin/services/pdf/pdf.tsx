import React, { FunctionComponent, useEffect, useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { PdfOverview } from './overview';
import { TestGenerate } from './testGenerate';
import { PdfTemplates } from './templates/templates';
import SupportLinks from '@components/SupportLinks';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { FetchFileTypeService, FetchFilesService } from '@store/file/actions';

export const Pdf: FunctionComponent = () => {
  const dispatch = useDispatch();
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [openAddTemplate, setOpenAddTemplate] = useState(false);

  useEffect(() => {
    dispatch(FetchFilesService());
    dispatch(FetchFileTypeService());
  }, [dispatch]);

  return (
    <Page>
      <Main>
        <h1 data-testid="pdf-service-title">PDF service</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview">
            <PdfOverview updateActiveIndex={setActiveIndex} setOpenAddTemplate={setOpenAddTemplate} />
          </Tab>
          <Tab label="Templates">
            <PdfTemplates openAddTemplate={openAddTemplate} />
          </Tab>
          <Tab label="Test generate">
            <TestGenerate />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <>
          <h3>Helpful links</h3>
          <a
            rel="noopener noreferrer"
            target="_blank"
            href={`${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=PDF Service`}
          >
            Read the API docs
          </a>
          <br />
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/pdf-service"
          >
            See the code
          </a>

          <SupportLinks />
        </>
      </Aside>
    </Page>
  );
};

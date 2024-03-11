import React, { useEffect, FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePdfResponse } from '@store/pdf/action';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import CheckmarkCircle from '@components/icons/CheckmarkCircle';
import CloseCircle from '@components/icons/CloseCircle';
import InformationCircle from '@components/icons/InformationCircle';
import { ConfigurationTableStyles } from '../styled-components';
import { PageIndicator } from '@components/Indicator';

const Imports: FunctionComponent = () => {
  const dispatch = useDispatch();
  const fileList = useSelector((state: RootState) => state.fileService.fileList);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  useEffect(() => {
    dispatch(updatePdfResponse({ fileList: fileList }));
  }, [fileList, dispatch]);

  const imports = useSelector((state: RootState) => state.configuration.imports);

  const RenderFileTable = () => {
    return (
      <ConfigurationTableStyles>
        {imports.length > 0 && (
          <div>
            <h4>
              <b>Status - import operation results</b>
            </h4>

            <DataTable id="files-information">
              <thead>
                <tr>
                  <th>Configuration Name</th>
                  <th>Status</th>
                  <th>Revision</th>
                  <th>Info</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((imp, key) => {
                  return (
                    <tr key={key}>
                      <td>
                        {imp.namespace}:{imp.name}
                      </td>
                      <td>
                        <div className="flex-horizontal mt-2">
                          <div className="mt-1">
                            {imp.success ? <CheckmarkCircle size="medium" /> : <CloseCircle size="medium" />}
                          </div>
                          {imp.success}
                          <div className="flex">{imp.success ? 'Success' : 'Failure'}</div>
                        </div>
                      </td>
                      <td>
                        <div>{imp.latest.revision}</div>
                      </td>
                      <td>
                        <div>
                          {!imp.success && (
                            <div title={imp.error}>
                              <InformationCircle size="medium" />{' '}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            {indicator.show && <PageIndicator />}
          </div>
        )}
      </ConfigurationTableStyles>
    );
  };

  return <RenderFileTable />;
};

export default Imports;

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DownloadFileService } from '@store/file/actions';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';

import { GoAIconButton } from '@abgov/react-components/experimental';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';
import CheckmarkCircle from '@components/icons/CheckmarkCircle';
import CloseCircle from '@components/icons/CloseCircle';
import InformationCircle from '@components/icons/InformationCircle';
import { FileTableStyles, ButtonBox, BadgeWrapper } from '../styled-components';
import { GoABadge } from '@abgov/react-components-new';
import { showCurrentFilePdf, setPdfDisplayFileId, deletePdfFileService } from '@store/pdf/action';
import { DeleteModal } from '@components/DeleteModal';

interface GeneratedPdfListProps {
  templateId: string;
}

const GeneratedPdfList = ({ templateId }: GeneratedPdfListProps): JSX.Element => {
  const dispatch = useDispatch();
  const fileList = useSelector((state: RootState) => state.fileService.fileList);
  const files = useSelector((state: RootState) => state.pdf.files);
  const onDownloadFile = async (file) => {
    dispatch(DownloadFileService(file));
  };
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(null);
  const onDeleteFile = async (file) => {
    setShowDeleteConfirmation(file);
  };

  const pdfList = useSelector((state: RootState) => state.pdf.jobs.filter((job) => job.templateId === templateId));

  const currentId = useSelector((state: RootState) => state?.pdf.currentId);

  const currentFile = fileList.find((file) => file.id === currentId);

  const statusGenerator = {
    queued: 'Queued',
    'pdf-generation-queued': 'Queued',
    'pdf-generated': 'Generated',
    'pdf-generation-failed': 'Failed',
  };
  const iconGenerator = {
    queued: <InformationCircle size="medium" />,
    'pdf-generation-queued': <InformationCircle size="medium" />,
    'pdf-generated': <CheckmarkCircle size="medium" />,
    'pdf-generation-failed': <CloseCircle size="medium" />,
  };
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const showCurrentPdf = (file) => {
    if (Object.keys(files).includes(file.id)) {
      dispatch(setPdfDisplayFileId(file.id));
    } else {
      dispatch(showCurrentFilePdf(file.id));
    }
  };

  const jobList = pdfList.length > 5 ? pdfList.slice(0, 5) : pdfList;

  const RenderFileTable = () => {
    return (
      <>
        <FileTableStyles>
          <DataTable id="pdf-files-information" data-testid="pdf-files-information">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Status</th>
                <th>Size (KB)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobList.length === 0 && (
                <div className="some-margin" data-testid="no-pdf-file-generated">
                  No PDF's have been generated yet
                </div>
              )}
              {jobList.map((job) => {
                const file = fileList.find(
                  (file) => file.recordId === job.id && file.filename.indexOf(templateId) > -1
                );
                const key = new Date().valueOf();
                const status = file?.filename ? 'pdf-generated' : job.status;
                return (
                  <>
                    {(file || indicator.show) && (
                      <tr key={key}>
                        <td>{job.filename}</td>
                        {/* Use ceil here to make sure people will allocate enough resources */}
                        <td>
                          <div className="flex-horizontal mt-2">
                            <div className="mt-1">{iconGenerator[status]}</div>
                            <div className="flex">{statusGenerator[status]}</div>
                            <div className="flex-auto">
                              {currentFile?.filename === job?.filename && (
                                <BadgeWrapper>
                                  <GoABadge content={'Viewing'} data-testid="viewing-badge" type="information" />
                                </BadgeWrapper>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {file?.size ? (
                            Math.ceil(file.size / 1024)
                          ) : (
                            <div>
                              {!indicator.show ? (
                                'Deleted'
                              ) : (
                                <GoASkeletonGridColumnContent rows={1}></GoASkeletonGridColumnContent>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="display-flex">
                          {file?.filename ? (
                            <>
                              {currentFile?.filename !== job?.filename ? (
                                <GoAIconButton
                                  title="Toggle details"
                                  type={'eye'}
                                  onClick={() => showCurrentPdf(file)}
                                  testId="toggle-details-visibility"
                                />
                              ) : (
                                <ButtonBox />
                              )}
                              <GoAIconButton
                                disabled={!file?.size}
                                testId="download-icon"
                                size="medium"
                                type="download"
                                onClick={() => onDownloadFile(file)}
                              />
                              <GoAIconButton
                                data-testid="delete-icon"
                                size="medium"
                                type="trash"
                                testId="delete-file-icon"
                                onClick={() => onDeleteFile(file)}
                              />
                            </>
                          ) : (
                            <div>
                              {indicator.show && <GoASkeletonGridColumnContent rows={1}></GoASkeletonGridColumnContent>}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </DataTable>
          {/* Delete confirmation */}
          {showDeleteConfirmation && (
            <DeleteModal
              isOpen={showDeleteConfirmation}
              title="Delete PDF file"
              content={
                <div>
                  Are you sure you wish to delete <b>{showDeleteConfirmation.filename}?</b>
                </div>
              }
              onCancel={() => setShowDeleteConfirmation(null)}
              onDelete={() => {
                const file = showDeleteConfirmation;
                dispatch(deletePdfFileService(file));
                setShowDeleteConfirmation(null);
              }}
            />
          )}
        </FileTableStyles>
      </>
    );
  };

  return <RenderFileTable />;
};

export default GeneratedPdfList;

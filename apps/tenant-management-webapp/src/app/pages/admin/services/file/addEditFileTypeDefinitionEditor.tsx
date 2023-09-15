import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { FileTypeEditor, FileTypeEditorTitle, SpinnerModalPadding } from './styled-components';
import { useDispatch } from 'react-redux';
import { GoAPageLoader } from '@abgov/react-components';

export const AddEditFileTypeDefinitionEditor = (): JSX.Element => {
  const history = useHistory();
  const dispatch = useDispatch();
  const [spinner, setSpinner] = useState<boolean>(false);
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });
  const { id } = useParams<{ id: string }>();

  const isEdit = !!id;

  useEffect(() => {
    //
  }, []);

  const goBack = () => {
    history.push({
      pathname: '/admin/services/form',
      search: '?templates=true',
    });
  };

  return (
    <FileTypeEditor data-testid="filetype-editor">
      <FileTypeEditorTitle>File Type</FileTypeEditorTitle>
      <hr className="hr-resize" />
      {spinner ? (
        <SpinnerModalPadding>
          <GoAPageLoader visible={true} type="infinite" message={'Loading...'} pagelock={false} />
        </SpinnerModalPadding>
      ) : null}
    </FileTypeEditor>
  );
};

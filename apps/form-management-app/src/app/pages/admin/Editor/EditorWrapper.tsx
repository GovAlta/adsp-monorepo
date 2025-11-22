import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../../../state';
import { loadDefinition } from '../../../state/form.slice';
import { Editor } from './Editor';
import { currentDefinitionSelector } from '../../../state/form.slice';
import { userSelector } from '../../../state';

export const EditorWrapper = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    console.log(JSON.stringify(id) + '<id');
    if (id !== undefined) {
      console.log(JSON.stringify('we are dispatch'));
      dispatch(loadDefinition(id));
    }
  });

  const user = useSelector(currentDefinitionSelector);
  console.log(JSON.stringify(user) + '> user');
  const definition = useSelector(currentDefinitionSelector);

  console.log(JSON.stringify(definition) + "<Definition--");

  return (
    <AdminLayout>
      <Main>
        <h2>Welcome to EditorWrapper</h2>
        {/* {definition?.id && <Editor definition={definition} />} */}
      </Main>
    </AdminLayout>
  );
};

const Main = styled.div`
  flex: 1 1 auto;
  padding: var(--goa-space-l, 24px) 0;
`;

const AdminLayout = styled.div`
  display: flex;
`;

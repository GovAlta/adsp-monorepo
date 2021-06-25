import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import {
  FileServiceDoc,
  FileServiceApiDoc,
  RequestBodySchema,
  RequestBodyProperties,
  SwaggerParameter,
} from '@store/file/models';
import { FetchFileDocsService } from '@store/file/actions';
import styled from 'styled-components';

interface FileDocSectionProps {
  name: string;
  doc: FileServiceDoc;
}

interface APIDocTableProps {
  doc: FileServiceApiDoc;
}

interface APIDocParameterTableProps {
  parameters: Array<SwaggerParameter>;
}

const DocFrame = styled.div`
  margin-left: 3rem;
`;

const APITableDesc = styled.div`
  margin-left: 1rem;
  line-height: 2.5rem;
`;

const APITableContainer = styled.div`
  margin-left: 3rem;
`;

const APIPath = styled.div`
  margin-left: 1rem;
  padding-left: 1rem;
  background: hsla(0, 0%, 0%, 0.05);
  padding-top: 0.7rem;
  padding-bottom: 0.7rem;
`;

const DocTable = styled.table`
  table-layout: fixed;
  width: 100%;
`;

const HeaderRow = styled.tr`
  height: 3rem;
  background: hsla(0, 0%, 0%, 0.05);
  text-indent: 0.5rem;
  text-align: left;
`;

const BodyRow = styled.tr`
  height: 2.5rem;
  text-align: left;
`;

const NameHeaderCell = styled.th`
  width: 25%;
`;

const TypeHeaderCell = styled.th`
  width: 25%;
`;
interface RequestBodyProps {
  properties: Record<string, unknown>;
}

const RequestBody = (props: RequestBodyProps) => {
  return (
    <DocTable>
      <tbody>
        <HeaderRow>
          <NameHeaderCell>Name</NameHeaderCell>
          <th>Description</th>
          <TypeHeaderCell>Type</TypeHeaderCell>
        </HeaderRow>
        {Object.entries(props.properties).map(([name, type], i) => {
          const propertyType = type as RequestBodyProperties;

          return (
            <BodyRow key={i}>
              <td>{name}</td>
              <td>{propertyType.description}</td>
              <td>
                {propertyType.type} {propertyType.format}
              </td>
            </BodyRow>
          );
        })}
      </tbody>
    </DocTable>
  );
};

const ParametersTable = (props: APIDocParameterTableProps) => {
  const parameters = props.parameters;
  return (
    <DocTable>
      <tbody>
        <HeaderRow>
          <NameHeaderCell>Name</NameHeaderCell>

          <th>Description</th>

          <TypeHeaderCell>Type</TypeHeaderCell>
        </HeaderRow>

        {parameters.map((p, i) => {
          const parameter = p as SwaggerParameter;

          return (
            <BodyRow key={i}>
              <td>{parameter.name}</td>
              <td>{parameter?.description}</td>
              <td>{parameter?.schema?.type}</td>
            </BodyRow>
          );
        })}
      </tbody>
    </DocTable>
  );
};

const DocEnd = styled.div`
  height: 3rem;
`;

const APIDocTable = (props: APIDocTableProps) => {
  const doc = props.doc;
  return (
    <div>
      <APIPath>
        {doc.method.toUpperCase()} {doc.path}{' '}
      </APIPath>
      <APITableDesc>{doc.description}</APITableDesc>
      <div>
        {doc.parameters ? (
          <APITableContainer>
            <h4>Parameters</h4>
            <ParametersTable parameters={doc.parameters} />
          </APITableContainer>
        ) : null}

        {doc.requestBody ? (
          <div>
            <APITableContainer>
              {Object.entries(doc.requestBody.content).map(([contentType, schema], i) => {
                const requestBodySchema = schema as RequestBodySchema;
                return (
                  <div key={i}>
                    <h4>Request Body ({contentType})</h4>
                    <RequestBody properties={requestBodySchema.schema.properties} />
                  </div>
                );
              })}
            </APITableContainer>
          </div>
        ) : null}
      </div>
      <DocEnd />
    </div>
  );
};

const FileDocSection = (props: FileDocSectionProps) => {
  const doc = props.doc;
  return (
    <DocFrame>
      <h2>{props.name}</h2>
      <h3>{doc.description}</h3>

      <div>
        {doc.apiDocs.map((apiDoc, path) => {
          return (
            <div key={path}>
              <APIDocTable doc={apiDoc} />
            </div>
          );
        })}
      </div>
    </DocFrame>
  );
};

interface FileDocSectionsProps {
  doc: FileServiceDoc;
}

const FileDoc = () => {
  const dispatch = useDispatch();
  const fileServiceDocs = useSelector((state: RootState) => state.fileService?.docs);
  const fileTypeDoc = fileServiceDocs?.fileTypeDoc;
  const fileDoc = fileServiceDocs?.fileDoc;

  useEffect(() => {
    if (!fileServiceDocs) {
      dispatch(FetchFileDocsService());
    }
  }, [dispatch, fileServiceDocs]);

  const FileDocSections = () => {
    return (
      <div>
        <FileDocSection name={'File Types APIs'} doc={fileTypeDoc} />
        <FileDocSection name={'Files APIs'} doc={fileDoc} />
      </div>
    );
  };

  return <div>{fileServiceDocs ? <FileDocSections /> : null} </div>;
};

export default FileDoc;

// import React, { useRef, useState } from 'react';
// import { ContextProviderFactory } from '@abgov/jsonforms-components';
// import styled from 'styled-components';
// import { JSONFormPreviewer } from './JsonFormPreviewer';
// import { NameDescriptionDataSchema, FormPreviewScrollPane } from './styled-components';

// import { useWindowDimensions } from '../../../components/useWindowDimensions';
// import { GoAFormItem } from '@abgov/react-components';
// import MonacoEditor, { useMonaco } from '@monaco-editor/react';
// import { Tab, Tabs} from '../../../components/Tabs'

// export const ContextProvider = ContextProviderFactory();

// export interface UiEditorContainerProps {
//   errors: Record<string, string | null>;
//   editorErrors: {
//     uiSchema: string | null;
//     dataSchemaJSON: string | null;
//     dataSchemaJSONSchema: string | null;
//   };
//   tempUiSchema: any;
//   setDraftUiSchema: (schema: any) => void;
//   setEditorErrors: React.Dispatch<
//     React.SetStateAction<{
//       uiSchema: string | null;
//       dataSchemaJSON: string | null;
//       dataSchemaJSONSchema: string | null;
//     }>
//   >;
// }

// export const Preview: React.FC<UiEditorContainerProps> = ({
//   fileList,
//   uploadFile,
//   downloadFile,
//   deleteFile,
//   formServiceApiUrl
//   setEditorErrors,
//   schemaError
// }): JSX.Element => {
//   return (
//     <div>
//       <Tabs data-testid="preview-tabs" activeIndex={0} changeTabCallback={saveCurrentTab}>
//         <Tab label="Preview" data-testid="preview-view-tab">
//           <FormPreviewScrollPane>
//             <ContextProvider
//               fileManagement={{
//                 fileList: fileList,
//                 uploadFile: uploadFile,
//                 downloadFile: downloadFile,
//                 deleteFile: deleteFile,
//               }}
//               formUrl={formServiceApiUrl}
//             >
//               <GoAFormItem error={schemaError} label="">
//                 <JSONFormPreviewer
//                   onChange={({ data }) => {
//                     setData(data);
//                   }}
//                   data={data}
//                 />
//               </GoAFormItem>
//             </ContextProvider>
//           </FormPreviewScrollPane>
//         </Tab>
//         <Tab label="Data" data-testid="data-view">
//           <ReviewPageTabWrapper>{data && <PRE>{JSON.stringify(data, null, 2)}</PRE>}</ReviewPageTabWrapper>
//         </Tab>
//         {definition?.submissionPdfTemplate ? (
//           <Tab
//             label={<PreviewTop title="PDF Preview" form={definition} data={data} currentTab={currentTab} />}
//             data-testid="data-view"
//           >
//             <PDFPreviewTemplateCore formName={definition.name} />
//           </Tab>
//         ) : null}
//       </Tabs>
//     </div>
//   );
// };

// const Main = styled.div`
//   flex: 1 1 auto;
//   padding: var(--goa-space-l, 24px) 0;
// `;

// const AdminLayout = styled.div`
//   display: flex;
// `;

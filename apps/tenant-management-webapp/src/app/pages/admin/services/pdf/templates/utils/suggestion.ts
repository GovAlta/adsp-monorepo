import { FileItem } from '@store/pdf/model';

export interface EditorSuggestion {
  label: string;
  insertText: string;
  children?: EditorSuggestion[];
}

export const getSuggestion = (fileList?: FileItem[]) => {
  const tempFileList = fileList || [];
  return [
    {
      label: 'data',
      insertText: 'data',
      children: [
        {
          label: 'id',
          insertText: 'id',
        },
        {
          label: 'name',
          insertText: 'name',
        },
        {
          label: 'description',
          insertText: 'description',
        },
        {
          label: 'template',
          insertText: 'template',
        },
      ],
    },
    {
      label: 'file',
      insertText: 'file',
      children: [
        {
          label: 'fileId',
          insertText: 'fileId',
          children: getElementSuggestion(tempFileList, 'id'),
        },
        {
          label: 'urn',
          insertText: 'urn',
          children: getElementSuggestion(tempFileList, 'urn'),
        },
        {
          label: 'name',
          insertText: 'name',
          children: getElementSuggestion(tempFileList, 'filename'),
        },
      ],
    },
  ];
};

const getElementSuggestion = (files: FileItem[], type: string) => {
  const suggest: EditorSuggestion[] = [];

  files.forEach((file) => {
    suggest.push({
      label: file[type],
      insertText: file[type],
    });
  });

  return suggest;
};

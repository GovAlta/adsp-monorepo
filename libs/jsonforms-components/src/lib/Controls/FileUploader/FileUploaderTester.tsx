import { rankWith, RankedTester, uiTypeIs, and } from '@jsonforms/core';

export const FileUploaderTester: RankedTester = rankWith(2, and(uiTypeIs('FileUploader')));

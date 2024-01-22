import { rankWith, RankedTester, scopeEndsWith } from '@jsonforms/core';

export const FileUploaderTester: RankedTester = rankWith(2, scopeEndsWith('FileUploader'));

// {
//   "type": "Control",
//   "scope": "#/properties/FileUploader"
// }

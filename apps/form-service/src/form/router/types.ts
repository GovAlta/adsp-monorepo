export const SEND_CODE_OPERATION = 'send-code';
export const UNLOCK_FORM_OPERATION = 'unlock';
export const SUBMIT_FORM_OPERATION = 'submit';
export const ARCHIVE_FORM_OPERATION = 'archive';

interface SendCodeOperation {
  operation: typeof SEND_CODE_OPERATION;
}

interface UnlockFormOperation {
  operation: typeof UNLOCK_FORM_OPERATION;
}

interface SubmitFormOperation {
  operation: typeof SUBMIT_FORM_OPERATION;
}

interface ArchiveFormOperation {
  operation: typeof ARCHIVE_FORM_OPERATION;
}

export type FormOperations = SendCodeOperation | UnlockFormOperation | SubmitFormOperation | ArchiveFormOperation;

import {
  ActionTypes,
  FETCH_FILE_LIST_SUCCESSES,
  UPLOAD_FILE_SUCCESSES,
  DELETE_FILE_SUCCESSES,
  TERMINATE_FILE_SERVICE,
  //DISABLE_FILE_SERVICE,
  ENABLE_FILE_SERVICE,
  FETCH_FILE_SPACE_SUCCEEDED,
  //SETUP_FILE_SERVICE,
  CREATE_FILE_SPACE_SUCCEEDED,
  CREATE_FILE_SPACE_FAILED,
  FETCH_FILE_TYPE_SUCCEEDED,
  DELETE_FILE_TYPE_SUCCEEDED,
  UPDATE_FILE_TYPE_SUCCEEDED,
  CREATE_FILE_TYPE_SUCCEEDED,
  FETCH_FILE_DOCS_SUCCEEDED,
} from './actions';
import { FILE_INIT, FileService } from './models';

function removeSpecifiedFileType(fileTypes, fileType) {
  const index = fileTypes.findIndex(({ id }) => id === fileType.id);
  const newFileTypes = fileTypes.map((x) => Object.assign({}, x));
  newFileTypes.splice(index, 1);
  return newFileTypes;
}

function updateSpecifiedFileType(fileTypes, fileType) {
  const index = fileTypes.findIndex(({ id }) => id === fileType.id);
  const newFileTypes = fileTypes.map((x) => Object.assign({}, x));
  newFileTypes[index] = fileType;
  return newFileTypes;
}

function uploadFile(fileList, file) {
  const newFileList = fileList.map((x) => Object.assign({}, x));
  newFileList.push(file);
  return newFileList;
}

function deleteFile(fileList, file) {
  const index = fileList.findIndex(({ id }) => id === file.id);
  const newFileList = fileList.map((x) => Object.assign({}, x));
  newFileList.splice(index, 1);
  return newFileList;
}
export default function (state = FILE_INIT, action: ActionTypes): FileService {
  switch (action.type) {
    case ENABLE_FILE_SERVICE:
      return {
        ...state,
      };

    case TERMINATE_FILE_SERVICE:
      return {
        ...state,
      };
    case UPLOAD_FILE_SUCCESSES: // add file to fileList
      return {
        ...state,
        fileList: uploadFile(state.fileList, action.payload.result),
      };
    case DELETE_FILE_SUCCESSES:
      return {
        ...state, // remove delete file from reducer
        fileList: deleteFile(state.fileList, action.payload.data),
      };
    case FETCH_FILE_LIST_SUCCESSES:
      return {
        ...state,
        fileList: action.payload.results.data,
      };

    case CREATE_FILE_SPACE_SUCCEEDED:
    case FETCH_FILE_SPACE_SUCCEEDED: {
      return {
        ...state,
        space: action.payload.fileInfo.data,
      };
    }

    case CREATE_FILE_SPACE_FAILED: {
      return {
        ...state,
        space: null,
      };
    }

    case FETCH_FILE_TYPE_SUCCEEDED:
      return {
        ...state,
        fileTypes: action.payload.fileInfo.data,
      };

    case DELETE_FILE_TYPE_SUCCEEDED:
      return {
        ...state,
        fileTypes: removeSpecifiedFileType(state.fileTypes, action.payload.fileInfo),
      };

    case UPDATE_FILE_TYPE_SUCCEEDED:
      return {
        ...state,
        fileTypes: updateSpecifiedFileType(state.fileTypes, action.payload.fileInfo.data),
      };

    case CREATE_FILE_TYPE_SUCCEEDED:
      return {
        ...state,
        fileTypes: [...(state.fileTypes || []), action.payload.fileInfo.data],
      };

    case FETCH_FILE_DOCS_SUCCEEDED:
      return {
        ...state,
        docs: action.payload.fileDocs,
      };

    default:
      return state;
  }
}

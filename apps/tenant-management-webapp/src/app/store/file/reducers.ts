import {
  ActionTypes,
  FETCH_FILE_LIST_SUCCESSES,
  UPLOAD_FILE_SUCCESSES,
  DELETE_FILE_SUCCESSES,
  FETCH_FILE_TYPE_SUCCEEDED,
  DELETE_FILE_TYPE_SUCCEEDED,
  UPDATE_FILE_TYPE_SUCCEEDED,
  CREATE_FILE_TYPE_SUCCEEDED,
  FETCH_FILE_TYPE_HAS_FILE_SUCCEEDED,
  FETCH_FILE_METRICS_SUCCEEDED,
} from './actions';
import { FILE_INIT, FileService } from './models';

function removeSpecifiedFileType(fileTypes, fileType) {
  const index = fileTypes.findIndex(({ id }) => id === fileType.id);
  const newFileTypes = fileTypes.map((x) => Object.assign({}, x));
  newFileTypes.splice(index, 1);
  return { ...newFileTypes };
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

function deleteFile(fileList, id) {
  return fileList.filter((file) => {
    return file.id !== id;
  });
}
export default function (state = FILE_INIT, action: ActionTypes): FileService {
  switch (action.type) {
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
    case FETCH_FILE_TYPE_SUCCEEDED:
      return {
        ...state,
        fileTypes: action.payload.fileInfo.tenant,
        coreFileTypes: action.payload.fileInfo.core,
      };
    case DELETE_FILE_TYPE_SUCCEEDED:
      return {
        ...state,
        fileTypes: removeSpecifiedFileType(state.fileTypes, action.payload),
      };
    case UPDATE_FILE_TYPE_SUCCEEDED:
      return {
        ...state,
        fileTypes: updateSpecifiedFileType(state.fileTypes, action.payload),
      };
    case CREATE_FILE_TYPE_SUCCEEDED:
      return {
        ...state,
        fileTypes: [...(state.fileTypes || []), action.payload],
      };
    case FETCH_FILE_TYPE_HAS_FILE_SUCCEEDED: {
      const newState = { ...state };
      const { hasFile, fileTypeId } = action.payload;
      for (const index in newState.fileTypes) {
        if (newState.fileTypes[index].id === fileTypeId) {
          newState.fileTypes[index].hasFile = hasFile;
        }
      }
      return newState;
    }
    case FETCH_FILE_METRICS_SUCCEEDED:
      return {
        ...state,
        metrics: action.payload,
      };
    default:
      return state;
  }
}

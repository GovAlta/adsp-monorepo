import {
  ActionTypes,
  FETCH_FILE_LIST_SUCCESSES,
  UPLOAD_FILE_SUCCESSES,
  DELETE_FILE_SUCCESSES,
  FETCH_FILE_TYPE_SUCCEEDED,
  FETCH_FILE_LIST,
  FETCH_FILE_SUCCESS,
  CLEAR_NEW_FILE_LIST,
  UPLOAD_FILE_FAILED,
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
  newFileList.unshift(file);
  return newFileList;
}

function deleteFile(fileList, id) {
  return fileList.filter((file) => {
    return file.id !== id;
  });
}
export default function (state = FILE_INIT, action: ActionTypes): FileService {
  switch (action.type) {
    case UPLOAD_FILE_SUCCESSES: {
      // add file to fileList
      const propertyId = action.payload.result.propertyId;

      const newFileList = JSON.parse(JSON.stringify(state.newFileList)) || {};
      newFileList[propertyId] = [...(newFileList[propertyId] || []), action.payload.result];
      return {
        ...state,
        fileList: uploadFile(state.fileList, action.payload.result),
        newFileList: newFileList,
      };
    }
    case UPLOAD_FILE_FAILED: {
      return {
        ...state,
        newFileList: { ...state.newFileList },
      };
    }
    case DELETE_FILE_SUCCESSES: {
      const newFileList = { ...state.newFileList };

      if (newFileList) {
        const keyList = Object.keys(newFileList);

        keyList.forEach((file) => {
          const fileList = newFileList[file];
          newFileList[file] = fileList
            .map((f) => {
              if (f.id === action.payload.data) {
                return null;
              } else {
                return f;
              }
            })
            .filter(Boolean);
        });
      }

      return {
        ...state,
        fileList: deleteFile(state.fileList, action.payload.data),
        newFileList: newFileList,
      };
    }
    case FETCH_FILE_LIST:
      return {
        ...state,
        isLoading: true,
      };
    case FETCH_FILE_LIST_SUCCESSES: {
      const fileList = action.payload.results.after
        ? [...state.fileList, ...action.payload.results.data]
        : action.payload.results.data;
      return {
        ...state,
        fileList: fileList,
        nextEntries: action.payload.results.next,
        isLoading: false,
      };
    }
    case FETCH_FILE_SUCCESS: {
      const fileList = [action.payload.results, ...state.fileList];
      return {
        ...state,
        fileList: fileList,
        isLoading: false,
      };
    }
    case FETCH_FILE_TYPE_SUCCEEDED:
      return {
        ...state,
        fileTypes: action.payload.fileInfo.tenant,
        coreFileTypes: action.payload.fileInfo.core,
      };
    case CLEAR_NEW_FILE_LIST:
      return {
        ...state,
        newFileList: null,
      };
    default:
      return state;
  }
}

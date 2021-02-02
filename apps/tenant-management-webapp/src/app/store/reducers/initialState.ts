/**
 * isActive - whether the file service is ready
 * isDiable - whether the server is enabled by user or admin
 */
const FILE_INIT = {
  config: {
    spaces: ['ADS-test'],
  },
  status: {
    isActive: true,
    isDisable: true,
  },
  requirements: {
      setup: false
  },
  states: {
    activeTab: 'overall-view'
  }
}

const INIT_STATE = {
  tenant: {
    file: FILE_INIT,
  },
};

export default INIT_STATE;

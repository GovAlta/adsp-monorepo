export const REPORTS_BASE_PATH = '/admin/reports';

export const reportsPath = (serviceId?: string, search = ''): string => {
  const path = serviceId ? `${REPORTS_BASE_PATH}/${serviceId}` : REPORTS_BASE_PATH;
  return search ? `${path}?${search}` : path;
};

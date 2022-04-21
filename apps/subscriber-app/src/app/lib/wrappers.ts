export const phoneWrapper = (phoneNumber: string): string => {
  if (phoneNumber) {
    return phoneNumber.substring(0, 3) + ' ' + phoneNumber.substring(3, 6) + ' ' + phoneNumber.substring(6, 10);
  }
};

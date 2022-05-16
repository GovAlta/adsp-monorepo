//eslint-disable-next-line
export const phoneWrapper = (phoneNumber) => {
  if (phoneNumber) {
    return (
      '1 (' + phoneNumber.substring(0, 3) + ') ' + phoneNumber.substring(3, 6) + '-' + phoneNumber.substring(6, 10)
    );
  }
};

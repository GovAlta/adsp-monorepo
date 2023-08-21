export const phoneWrapper = (phoneNumber: string): string => {
  if (phoneNumber && phoneNumber.length === 10) {
    const validPhoneNumber = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im;
    if (validPhoneNumber.test(phoneNumber)) {
      return phoneNumber.substring(0, 3) + ' ' + phoneNumber.substring(3, 6) + ' ' + phoneNumber.substring(6, 10);
    }
  }
};

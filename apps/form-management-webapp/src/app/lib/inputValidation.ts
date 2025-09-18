export const isSmsValid = (value: string): boolean => {
  if (value) {
    // eslint-disable-next-line
    return /^[0-9\.\-\/]+$/.test(value);
  }

  return true;
};

interface Errors {
  email?: string;
  sms?: string;
}

export const emailError = (email: string): Errors => {
  if (!/^\w+(?:[.-]\w+)*@\w+(?:[.-]\w+)*(?:\.\w{2,3})+$/.test(email)) {
    return { email: 'You must enter a valid email' };
  }
};

export const hasMultipleEmailError = (email: string): Errors => {
  if (email.includes(';')) {
    const emailList = email.split(';');
    if (emailList.length > 1 && emailList.at(-1) !== '') {
      return { email: 'You cannot have multiple email addresses' };
    }
  }
};

export const smsError = (phoneNumber: string): Errors => {
  if (!/^\d{10}$/.test(phoneNumber) && phoneNumber.length !== 0) {
    return { sms: 'Please enter a valid 10 digit phone number ie. 7801234567' };
  }
};

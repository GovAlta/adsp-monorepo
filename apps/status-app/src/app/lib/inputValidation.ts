interface Errors {
  email?: string;
}

export const emailError = (email: string): Errors | undefined => {
  if (!/^\w+(?:[.-]\w+)*@\w+(?:[.-]\w+)*(?:\.\w{2,3})+$/.test(email)) {
    return { email: 'You must enter a valid email' };
  }
};

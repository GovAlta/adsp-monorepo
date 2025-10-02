export function readFileAsync(file): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve(base64Data as unknown as Blob);
    };

    reader.onerror = reject;
  });
}

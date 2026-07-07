export type GenerateImageParams = {
  roomImage: File;
  sofaImage: File;
};

export async function generateImage({
  roomImage,
  sofaImage,
}: GenerateImageParams) {
  console.log(roomImage);
  console.log(sofaImage);

  return null;
}
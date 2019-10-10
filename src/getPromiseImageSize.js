export default function getPromiseImageSize(imagePath) {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.onload = function() {
      resolve({ width: this.width, height: this.height });
    };
    img.onerror = reject;
    img.src = imagePath;
  });
}

import MatterBox from "./index";

new MatterBox("#app", {
  textureFilePath:
    "https://one-forty.org/wp-content/themes/one-forty/assets/images/2019/book.png",
  textureScale: 0.8,
  boxFillPercentage: 1,
  enableMouseWheel: true,
  hoverVelocityScale: 1.7,
  mode: "dev",
  isDevMode: false,
  isTextureHidden: false,
});

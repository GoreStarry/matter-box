// 引入方法
// 1.直接到 dist 資料夾中複製包好的 globalMatterBox.js，引入執行後即可在全域變數(window) 拿到 MatterBox
// 2.直接到 dist 資料夾中複製包好的 index.js
// 然後 import MatterBox from "./xx/index.js"; or const MatterBox = require("./xx/index.js").default
// 3. npm install git+https://github.com/GoreStarry/matter-box.git
// 然後 import MatterBox from "matter-box"; or const MatterBox = require('matter-box').default

import MatterBox from "./index.js";

const mb = new MatterBox("#app", {
  // 圖片位置
  textureFilePath:
    "https://one-forty.org/wp-content/themes/one-forty/assets/images/2019/book.png",
  textureScale: 2, // 原圖縮放比例
  boxFillPercentage: 0.5, // 初始化 stack 的時候放滿多少（掉落後會重疊，所以掉落後會更少）
  enableMouseWheel: true, // 給不給電腦滑鼠滾輪或觸控板，於canvas區塊內滑動
  hoverVelocityScale: 1.5, // 滑鼠滑過物件的時候推動的加速度比率
  isDevMode: false, // 開啟物件方向、速度等輔助線
  isTextureHidden: false, // 隱藏物件貼圖
  canvasBackgroundColor: "transparent", // canvas 背景色
  angular: {
    maxInitialAngular: 10, // Number: 0~360 (deg)
    maxInitialAngularVelocity: 60, // Number: 0~360 (deg)
  },
});

// 預設直接播放，如果想先初始化但不執行就先：
// mb.stop();

// 時候到再 play
// setTimeout(() => {
//   mb.play();
// }, 3000);

// 沒用的時候有 kill 方法
// setTimeout(() => {
//   mb.kill();
// }, 10000);

// 臨時追加 stack
// setTimeout(() => {
//   mb.add({
//     textureFilePath:
//       "https://one-forty.org/wp-content/themes/one-forty/assets/images/2019/book.png",
//     textureScale: 1,
//     boxFillPercentage: 1,
//   });
// }, 5000);

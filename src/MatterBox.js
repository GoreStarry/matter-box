import Matter, {
  Engine,
  Render,
  Runner,
  Composites,
  Common,
  MouseConstraint,
  Mouse,
  World,
  Bodies,
  Events,
  Body,
} from "matter-js";
import getPromiseImageSize from "./getPromiseImageSize";

const defaultOptions = {
  textureFilePath: undefined,
  textureScale: 1,
  boxFillPercentage: 1,
  enableMouseWheel: true,
  hoverVelocityScale: 1.8,
  isDevMode: false,
  isTextureHidden: false,
  canvasBackgroundColor: "transparent",
  angular: {
    maxInitialAngular: 0, // 0~360
    maxInitialAngularVelocity: 0, // 0~360
  },
};

export default class MatterBox {
  constructor(domTarget, options) {
    const {
      textureFilePath,
      textureScale,
      boxFillPercentage,
      enableMouseWheel,
      hoverVelocityScale,
      isDevMode,
      isTextureHidden,
      canvasBackgroundColor,
      angular,
    } = Object.assign({}, defaultOptions, options);

    this.domTarget = document.querySelector(domTarget) || document.body;
    this.enableMouseWheel = enableMouseWheel;
    this.hoverVelocityScale = hoverVelocityScale;
    this.isDevMode = isDevMode;
    this.isTextureHidden = isTextureHidden;
    this.canvasBackgroundColor = canvasBackgroundColor;
    this.boxFillPercentageList = [boxFillPercentage];
    this.angular = angular;
    this.spriteList = [
      this._transformSpriteSettings(textureFilePath, textureScale),
    ];

    this._initMatter();
  }

  _transformSpriteSettings = (textureFilePath, textureScale) => ({
    texture: textureFilePath,
    xScale: textureScale,
    yScale: textureScale,
  });

  play() {
    Runner.run(this.engine);
    Render.run(this.render);
  }

  stop() {
    Runner.stop(this.runner);
    Render.stop(this.render);
  }

  kill() {
    this.render.canvas.remove();
    this.stackList.length = 1;
    this.spriteList.length = 1;
    this._removeResizeEventListener();
  }

  async add({ textureFilePath, textureScale, boxFillPercentage }) {
    this._addSprite(
      this._transformSpriteSettings(textureFilePath, textureScale)
    );
    this.boxFillPercentageList = [
      ...this.boxFillPercentageList,
      boxFillPercentage,
    ];
    const stack = await this._getStack(this.spriteList.length - 1);
    this.stackList.push(stack);
    const mouseControl = this._getMouseControl();
    World.add(this.engine.world, [stack, mouseControl]);
    this._setStackRandomInitAngularVelocity(this.spriteList.length - 1);
  }

  _preventDomTargetTouchMove() {
    this.domTarget.ontouchend = e => {
      e.preventDefault();
    };
  }

  _resizeHandler = () => {
    if (window.innerWidth != this.cacheDomTargetWidth) {
      this.kill();
      this._initMatter();
    }
  };

  _addResizeEventListener() {
    window.addEventListener("resize", this._resizeHandler, false);
  }

  _removeResizeEventListener() {
    window.removeEventListener("resize", this._resizeHandler, false);
  }

  async _initMatter() {
    this.engine = Engine.create();
    this._createRender();
    this._createRunner();
    this.cacheDomTargetWidth = this.domTarget.clientWidth;
    const stack = await this._getStack();
    this.stackList = [stack];
    const wallList = this._getWallList();
    const mouseControl = this._getMouseControl();

    this._fitRenderViewportToScene();
    World.add(this.engine.world, [stack, ...wallList, mouseControl]);
    this._setStackRandomInitAngularVelocity();

    this._addResizeEventListener();
  }

  _addSprite(sprite) {
    this.spriteList.push(sprite);
  }

  _setStackRandomInitAngularVelocity(stackIndex = 0) {
    this.stackList[stackIndex].bodies.forEach(body => {
      Body.setAngularVelocity(
        body,
        Common.random(
          0,
          (this.angular.maxInitialAngularVelocity / 180) * Math.PI
        )
      );
    });
  }

  _fitRenderViewportToScene() {
    const { clientWidth, clientHeight } = this.domTarget;
    Render.lookAt(this.render, {
      min: { x: 0, y: 0 },
      max: { x: clientWidth, y: clientHeight },
    });
  }

  _getMouseControl() {
    this.mouseConstraint && Events.off(this.mouseConstraint);
    // keep the mouse in sync with rendering
    const mouse = Mouse.create(this.render.canvas);

    if (this.enableMouseWheel) {
      mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
      mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
    }

    this.render.mouse = mouse;
    const mouseConstraint = MouseConstraint.create(this.engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });

    this.prevMousePosition = {};

    Events.on(mouseConstraint, "mousemove", ({ mouse: { position } }) => {
      var [body] = Matter.Query.point(
        this.stackList.reduce((prev, current, index) => {
          return [...prev, ...current.bodies];
        }, []),
        position
      );
      const { x, y } = position;
      if (body) {
        const { x: PrevX, y: PrevY } = this.prevMousePosition;
        Body.setVelocity(body, {
          x: (x - PrevX) * this.hoverVelocityScale,
          y: (y - PrevY) * this.hoverVelocityScale,
        });
      }
      this.prevMousePosition = { x, y };
    });
    this.mouseConstraint = mouseConstraint;
    return mouseConstraint;
  }

  _getWallList() {
    const x1 = this.domTarget.clientWidth;
    const y1 = this.domTarget.clientHeight;

    const wallThick = 50;
    const options = {
      isStatic: true,
      restitution: 0.9,
    };
    return [
      // bottom
      Bodies.rectangle(x1 / 2, y1 + wallThick / 2, x1, wallThick, options),
      // left
      Bodies.rectangle(-wallThick / 2, 0, wallThick, y1 * 2, options),
      // right
      Bodies.rectangle(x1 + wallThick / 2, 0, wallThick, y1 * 2, options),
      // top
      Bodies.rectangle(x1 / 2, -y1, x1, wallThick, options),
    ];
  }

  _createEngine() {
    this.engine = Engine.create();
  }

  _createRender() {
    this.render = Render.create({
      element: this.domTarget,
      engine: this.engine,
      options: {
        width: this.domTarget.clientWidth,
        height: this.domTarget.clientHeight,
        showAngleIndicator: this.isDevMode,
        showVelocity: this.isDevMode,
        wireframes: this.isTextureHidden,
        background: this.canvasBackgroundColor,
      },
    });
    Render.run(this.render);
  }

  _createRunner() {
    this.runner = Runner.create();
    Runner.run(this.runner, this.engine);
  }

  _getStack = async (spriteIndex = 0) => {
    const sprite = this.spriteList[spriteIndex];
    const { width: imgWidth, height: imgHeight } = await getPromiseImageSize(
      sprite.texture
    );

    const optionRender = {
      // mass: 10,
      render: {
        sprite,
      },
      frictionAir: 0.03,
      // restitution: 1,
    };

    const x1 = this.domTarget.clientWidth;
    const y1 = this.domTarget.clientHeight;

    const imageSize =
      (imgWidth > imgHeight ? imgHeight : imgWidth) * sprite.xScale;
    const imgWidthScaleX = imgWidth * sprite.xScale;
    const colNumImage = Math.ceil(x1 / imgWidthScaleX);
    return Composites.stack(
      imgWidthScaleX / 3,
      -imgHeight * sprite.yScale,
      colNumImage + 1,
      Math.ceil(
        (y1 * this.boxFillPercentageList[spriteIndex]) /
          (imgHeight * sprite.yScale)
      ) + 1,
      (x1 - colNumImage * imgWidthScaleX * 0.5) / colNumImage,
      -imgHeight / 2,
      (x, y) => {
        // 獲取隨機多邊
        let sides = Math.round(Common.random(1, 8));

        // triangles can be a little unstable, so avoid until fixed
        sides = sides === 3 ? 4 : sides;

        // round the edges of some bodies
        var chamfer = null;
        if (sides > 2 && Common.random() > 0.7) {
          chamfer = {
            radius: 10,
          };
        }

        const randomBodySizeSmall = imageSize / 3;
        const randomBodySizeLarge = imageSize * 0.9;
        const randomInitAngular = Common.random(
          0,
          (this.angular.maxInitialAngular / 180) * Math.PI
        );
        switch (Math.round(Common.random(0, 1))) {
          case 0:
            return Bodies.rectangle(
              x,
              y,
              Common.random(randomBodySizeSmall, randomBodySizeLarge),
              Common.random(randomBodySizeSmall, randomBodySizeLarge),
              {
                chamfer: chamfer,
                ...optionRender,
                angle: randomInitAngular,
              }
            );
          case 1:
            return Bodies.polygon(
              x,
              y,
              sides,
              Common.random(randomBodySizeSmall, randomBodySizeLarge) / 2,
              {
                chamfer: chamfer,
                ...optionRender,
                angle: randomInitAngular,
              }
            );
        }
      }
    );
  };
}

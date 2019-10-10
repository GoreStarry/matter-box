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
  boxFillPercentage: 0.6,
  enableMouseWheel: true,
  hoverVelocityScale: 1.8,
  isDevMode: false,
  textureHidden: false,
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
    } = Object.assign({}, defaultOptions, options);

    this.domTarget = document.querySelector(domTarget) || document.body;
    this.enableMouseWheel = enableMouseWheel;
    this.hoverVelocityScale = hoverVelocityScale;
    this.isDevMode = isDevMode;
    this.isTextureHidden = isDevMode;
    this.sprite = {
      texture: textureFilePath,
      xScale: textureScale,
      yScale: textureScale,
    };
    this.boxFillPercentage = boxFillPercentage;
    this._initMatter();

    this._addResizeEventListener();
  }

  play() {
    this.render.run();
  }

  stop() {
    this.render.stop();
  }

  kill() {
    this.render.canvas.remove();
  }

  _preventDomTargetTouchMove() {
    this.domTarget.ontouchend = e => {
      e.preventDefault();
    };
  }

  _addResizeEventListener() {
    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth != this.cacheDomTargetWidth) {
          this.kill();
          this._initMatter();
        }
      },
      false
    );
  }

  async _initMatter() {
    this.engine = Engine.create();
    this._createRender();
    this._createRunner();
    this.cacheDomTargetWidth = this.domTarget.clientWidth;
    const stack = await this._getStack();
    this.stack = stack;
    const wallList = this._getWallList();
    const mouseControl = this._getMouseControl();
    // const mouseBody = this._getMouseBody();
    this._fitRenderViewportToScene();
    World.add(this.engine.world, [stack, ...wallList, mouseControl]);
  }

  _fitRenderViewportToScene() {
    const { clientWidth, clientHeight } = this.domTarget;
    Render.lookAt(this.render, {
      min: { x: 0, y: 0 },
      max: { x: clientWidth, y: clientHeight },
    });
  }

  // _getMouseBody() {
  //   const mouseBody = Bodies.rectangle(0, 0, 50, 50, {
  //     friction: 1,
  //   });
  //   this.mouseBody = mouseBody;
  //   return mouseBody;
  // }

  _getMouseControl() {
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
      var [body] = Matter.Query.point(this.stack.bodies, position);
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
      },
    });
    Render.run(this.render);
  }

  _createRunner() {
    this.runner = Runner.create();
    Runner.run(this.runner, this.engine);
  }

  _getStack = async () => {
    const { width: imgWidth, height: imgHeight } = await getPromiseImageSize(
      this.sprite.texture
    );

    const optionRender = {
      // mass: 10,
      render: {
        sprite: this.sprite,
      },
      frictionAir: 0.03,
      // restitution: 1,
    };

    const x1 = this.domTarget.clientWidth;
    const y1 = this.domTarget.clientHeight;

    return Composites.stack(
      0,
      -y1,
      x1 / imgWidth + 1,
      (y1 * this.boxFillPercentage) / imgHeight + 1,
      0,
      -imgHeight / 2,
      function(x, y) {
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

        const imageSize = imgWidth > imgHeight ? imgHeight : imgWidth;
        const randomBodySizeSmall = imageSize / 3;
        const randomBodySizeLarge = imageSize * 0.9;
        switch (Math.round(Common.random(0, 1))) {
          case 0:
            return Bodies.rectangle(
              x,
              y,
              Common.random(randomBodySizeSmall, randomBodySizeLarge),
              Common.random(randomBodySizeSmall, randomBodySizeLarge),
              { chamfer: chamfer, ...optionRender }
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
              }
            );
        }
      }
    );
  };
}

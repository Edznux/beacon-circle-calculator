const WIDTH = 800;
const HEIGHT = 800;
const RADIUS_IN_BLOCK = 21;
const RAYS = 11;
const BLOCK_IN_PX = HEIGHT / RADIUS_IN_BLOCK;
const VALID_RANGE_START = 5 * BLOCK_IN_PX;
const VALID_RANGE_END = 8 * BLOCK_IN_PX;
const INITIAL_THETA = 0.5;

var globalGrid: Grid;

interface Grid {
  blocks: Array<Block>;
  rays: Array<Ray>;
  draw: Function;
}

interface Block {
  x: number;
  y: number;
  size: number;
  draw: Function;
  fillColor: string;
  strokeColor: string;
  isColliding: boolean;
  isClosestToRay: boolean;
}

interface Ray {
  // start position
  x: number;
  y: number;
  //end position
  x2: number;
  y2: number;
  // angle in radian
  angle: number;
  // lenght of the ray
  distance: number;
  // list of blocks the rays collides with, in order from the center
  collidesWith: Array<Block>;
  draw: Function;
}

interface Config {
  Width: number; // 800;
  Height: number; // 800;
  RadiusInBlock: number; // 11;
  RaysCount: number; // 11;
  BlockInPx: number; // HEIGHT / RADIUS_IN_BLOCK;
  ValidRange: number[]; // 5 * BLOCK_IN_PX;
  InitialTheta: number; // 0.5;
  WorldStartX: number;
  WorldStartY: number;
}

var globalConfig: Config;

// wait for the dom to be loaded
document.addEventListener("DOMContentLoaded", function(ev) {
  start();
});

function start() {
  globalConfig = {
    BlockInPx: BLOCK_IN_PX,
    Height: HEIGHT,
    InitialTheta: INITIAL_THETA,
    Width: WIDTH,
    RadiusInBlock: RADIUS_IN_BLOCK,
    RaysCount: RAYS,
    ValidRange: [VALID_RANGE_START, VALID_RANGE_END],
    // -RADIUS_IN_BLOCK so we start at 0,0 for the center
    WorldStartX: -RADIUS_IN_BLOCK,
    WorldStartY: -RADIUS_IN_BLOCK,
  };
  var ctx = initCtx();
  globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
  generateListOfBeacons();
  // could use requestAnimationFrame but my computer makes more fan noise with it xd
  // 75 ms enough for such a use case (this doesn't need 144fps...)
  // the full draw takes about 3ms on my computer, on max size radius, so technically could run at 333fps but no need to do that)
  window.setInterval(function(){
    draw(ctx)
  }, 75);
}

var radiusElement = document.getElementById("radius") as HTMLInputElement;
var raysElement = document.getElementById("rays") as HTMLInputElement;
var thetaElement = document.getElementById("theta") as HTMLInputElement;
var showGridElement = document.getElementById("show_grid") as HTMLInputElement;
var showRaysElement = document.getElementById("show_rays") as HTMLInputElement;
var showValidRangeElement = document.getElementById("show_valid_range") as HTMLInputElement;
var minValidRangeElement = document.getElementById("min_valid_range") as HTMLInputElement;
var maxValidRangeElement = document.getElementById("max_valid_range") as HTMLInputElement;
var showCollidingElement = document.getElementById("show_colliding_rays") as HTMLInputElement;
var listOfBeaconsElement = document.getElementById("list_of_beacons") as HTMLUListElement;
var listOfBeaconsTitleElement = document.getElementById("list_of_beacons_title") as HTMLSpanElement;
var worldCenterXElement = document.getElementById("center_x") as HTMLInputElement;
var worldCenterYElement = document.getElementById("center_y") as HTMLInputElement;

radiusElement?.addEventListener("change", (ev: Event) => {
  var el = ev.target as HTMLInputElement;
  globalConfig.BlockInPx = WIDTH / el.valueAsNumber;
  // It doesn't really make sense on a grid to have a center of block in between 2 blocks, so we only allow odd numbers as radius
  // now to think of it... only the diameter needs to be odd, the radius can be even (since 2x anything will always be even 2x%2 always equals 0 right?)
  // but it ... works? sooooo ... I'll just leave it like this :D
  if (el.valueAsNumber % 2 == 0) {
    globalConfig.RadiusInBlock = el.valueAsNumber + 1;
  }else {
    globalConfig.RadiusInBlock = el.valueAsNumber;
  }
  globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
});

worldCenterXElement?.addEventListener("change", (ev: Event) => {
  var el = ev.target as HTMLInputElement;
  console.log(el.valueAsNumber)
  globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
  globalConfig.WorldStartX = el.valueAsNumber - globalConfig.RadiusInBlock;
  generateListOfBeacons();
});
worldCenterYElement?.addEventListener("change", (ev: Event) => {
  console.log(globalConfig)
  var el = ev.target as HTMLInputElement;
  globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
  globalConfig.WorldStartY = el.valueAsNumber - globalConfig.RadiusInBlock;
  generateListOfBeacons();
});
minValidRangeElement?.addEventListener("change", (ev: Event) => {
  var el = ev.target as HTMLInputElement;
  globalConfig.ValidRange[0] = el.valueAsNumber * BLOCK_IN_PX;
  globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
  generateListOfBeacons();
});
maxValidRangeElement?.addEventListener("change", (ev: Event) => {
  var el = ev.target as HTMLInputElement;
  globalConfig.ValidRange[1] = el.valueAsNumber * BLOCK_IN_PX;
  globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
  generateListOfBeacons();
});
raysElement?.addEventListener("change", (ev: Event) => {
  var el = ev.target as HTMLInputElement;
  globalConfig.RaysCount = el.valueAsNumber;
  globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
  generateListOfBeacons();
});
thetaElement?.addEventListener("change", (ev: Event) => {
  var el = ev.target as HTMLInputElement;
  globalConfig.InitialTheta = el.valueAsNumber;
  globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
  generateListOfBeacons();
});

function draw(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, globalConfig.Width, globalConfig.Height);
  globalGrid.draw(ctx);
  if (showValidRangeElement?.checked) {
    drawCircle(ctx, globalConfig.Width / 2, globalConfig.Height / 2, globalConfig.ValidRange[0]);
    drawCircle(ctx, globalConfig.Width / 2, globalConfig.Height / 2, globalConfig.ValidRange[1]);
  }
  globalGrid.blocks[Math.floor(globalGrid.blocks.length / 2)].fillColor = "#000000";
}

function initCtx(): CanvasRenderingContext2D | undefined {
  var canvas = document.getElementById("canvas") as HTMLCanvasElement;
  if (canvas == null) {
    return;
  }
  var ctx = canvas.getContext("2d");
  if (ctx == null) {
    return;
  }
  return ctx;
}

function generateListOfBeacons(){
  var count = 0;
  listOfBeaconsElement.innerHTML = "";
  for(var i = 0; i < globalGrid.blocks.length; i++) {
    if (globalGrid.blocks[i].isClosestToRay) {
      count++
      // Math.floor should not be used but I'm worried about floating point precision when mul then div
      var xCoordInBlockIndex = Math.floor(globalGrid.blocks[i].x/ globalConfig.BlockInPx)
      var yCoordInBlockIndex = Math.floor(globalGrid.blocks[i].y/ globalConfig.BlockInPx)
      let li = document.createElement('li')
      
      console.log(globalConfig.WorldStartX,globalConfig.WorldStartY, xCoordInBlockIndex, yCoordInBlockIndex, globalGrid.blocks[i])

      li.appendChild(document.createTextNode("x:"+ (globalConfig.WorldStartX+xCoordInBlockIndex) + " y:" + (globalConfig.WorldStartY+yCoordInBlockIndex)))
      listOfBeaconsElement.appendChild(li);
    }
  }
  listOfBeaconsTitleElement.innerHTML = "List of beacons (" +count + ")";
}
function doesCollide(ray: Ray, block: Block): Boolean {
  return lineRect(ray.x, ray.y, ray.x2, ray.y2, block.x, block.y, block.size, block.size)
}

function newRay(x: number, y: number, angle: number): Ray {
  let distance =
    (globalConfig.BlockInPx * globalConfig.RadiusInBlock) / 2 +
    globalConfig.ValidRange[1];
  return {
    distance: distance,
    x: x,
    y: y,
    x2: x + distance * Math.cos(angle),
    y2: y + distance * Math.sin(angle),
    angle: angle,
    collidesWith: [],
    draw: drawRay,
  };
}

function drawRay(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.strokeStyle = "#55FF00";
  ctx.moveTo(this.x, this.y);
  ctx.lineTo(this.x2, this.y2);
  ctx.stroke();
  ctx.closePath();
}

function generateGrid(side: number, raysCount: number): Grid {
  var g = {} as Grid;
  g.blocks = [];
  g.draw = drawGrid;
  g.rays = [];

  for (var x = 0; x < side; x++) {
    for (var y = 0; y < side; y++) {
      var b = generateBlock(x, y);
      g.blocks.push(b);
    }
  }

  let midBlock = g.blocks[Math.floor(g.blocks.length / 2)];
  let mid = midBlock.x + midBlock.size / 2;
  let angleIncrement = (2 * Math.PI) / raysCount;
  for (var rayIndex = 0; rayIndex < raysCount; rayIndex++) {
    let angle = angleIncrement * rayIndex + globalConfig.InitialTheta;
    let ray = newRay(mid, mid, angle);

    var closestToRay = {distance: g.blocks[0].size, blockIndex: 0};
    for (var blockIndex = 0; blockIndex < g.blocks.length; blockIndex++) {
      var blockCenterX =  (g.blocks[blockIndex].x + g.blocks[blockIndex].size / 2)
      var blockCenterY =  (g.blocks[blockIndex].y + g.blocks[blockIndex].size / 2)
      var distanceOfCenterX = blockCenterX- mid;
      var distanceOfCenterY = blockCenterY - mid;

      var hypotenuse = Math.sqrt(distanceOfCenterX*distanceOfCenterX + distanceOfCenterY*distanceOfCenterY);
      if (hypotenuse < globalConfig.ValidRange[0] || hypotenuse > globalConfig.ValidRange[1]) {
        continue;
      }
      if (!doesCollide(ray, g.blocks[blockIndex])) {
        continue
      }
      ray.collidesWith.push(g.blocks[blockIndex]);
      g.blocks[blockIndex].isColliding = true;
      var distanceToRay = pDistance(blockCenterX, blockCenterY, ray.x, ray.y, ray.x2, ray.y2);
      if(distanceToRay < closestToRay.distance) {
        closestToRay = {distance: distanceToRay, blockIndex: blockIndex};
        continue
      }
    }

    g.blocks[closestToRay.blockIndex].isClosestToRay = true;

    g.rays.push(ray);
  }
  return g;
}

function drawBlock(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(this.x, this.y);
  ctx.fillStyle = this.fillColor;
  ctx.strokeStyle = this.strokeColor;
  if (showGridElement.checked) {
    ctx.strokeRect(
      this.x,
      this.y,
      globalConfig.BlockInPx,
      globalConfig.BlockInPx,
    );
  }
  ctx.fillRect(this.x, this.y, globalConfig.BlockInPx, globalConfig.BlockInPx);
  ctx.fill();
  ctx.closePath();
}

function generateBlock(x: number, y: number): Block {
  var b = {} as Block;
  b.x = x * globalConfig.BlockInPx;
  b.y = y * globalConfig.BlockInPx;
  b.size = globalConfig.BlockInPx;
  b.draw = drawBlock;
  b.fillColor = "#FFFFFF";
  b.strokeColor = "#FF5500";
  return b;
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  for (var b = 0; b < this.blocks.length; b++) {
    if (showCollidingElement.checked && this.blocks[b].isColliding) {
      this.blocks[b].fillColor = "#FFFF55";
    }
    if (this.blocks[b].isClosestToRay) {
      this.blocks[b].fillColor = "#FF55FF";
    }
    this.blocks[b].draw(ctx);
  }

  // rays
  if (showRaysElement.checked) {
    for (var r = 0; r < this.rays.length; r++) {
      this.rays[r].draw(ctx);
    }
  }
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.strokeStyle = "#00FF00";
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.closePath();
}


// ==== external function === 
// https://crhallberg.com/CollisionDetection/Website/line-rect.html
function lineLine(x1, y1, x2, y2, x3, y3, x4, y4): boolean {
  var uA =
    ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) /
    ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  var uB =
    ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) /
    ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    return true;
  }
  return false;
}

function lineRect(x1, y1, x2, y2, rx, ry, rw, rh): boolean {
  var left = lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
  var right = lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
  var top = lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
  var bottom = lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);

  // if any of the above are true, the line has hit the rectangle
  if (left || right || top || bottom) {
    return true;
  }
  return false;
}

// https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
function pDistance(x, y, x1, y1, x2, y2) {
  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = -1;
  if (len_sq != 0) //in case of 0 length line
      param = dot / len_sq;

  var xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  }
  else if (param > 1) {
    xx = x2;
    yy = y2;
  }
  else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  var dx = x - xx;
  var dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}
var WIDTH = 800;
var HEIGHT = 800;
var RADIUS_IN_BLOCK = 99;
var RAYS = 11;
var BLOCK_IN_PX = HEIGHT / RADIUS_IN_BLOCK;
var VALID_RANGE_START = 5 * BLOCK_IN_PX;
var VALID_RANGE_END = 8 * BLOCK_IN_PX;
var INITIAL_THETA = 0.5;
var globalGrid;
var globalConfig = {
    BlockInPx: BLOCK_IN_PX,
    Height: HEIGHT,
    InitialTheta: INITIAL_THETA,
    Width: WIDTH,
    RadiusInBlock: RADIUS_IN_BLOCK,
    RaysCount: RAYS,
    ValidRange: [VALID_RANGE_START, VALID_RANGE_END],
    worldStartX: 0,
    worldStartY: 0,
};
// wait for the dom to be loaded
document.addEventListener("DOMContentLoaded", function (ev) {
    start();
});
function start() {
    var ctx = initCtx();
    globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
    generateListOfBeacons();
    // could use requestAnimationFrame but my computer makes more fan noise with it xd
    // 75 ms enough for such a use case (this doesn't need 144fps...)
    // the full draw takes about 3ms on my computer, on max size radius, so technically could run at 333fps but no need to do that)
    window.setInterval(function () { draw(ctx); }, 75);
}
var radiusElement = document.getElementById("radius");
var raysElement = document.getElementById("rays");
var thetaElement = document.getElementById("theta");
var showGridElement = document.getElementById("show_grid");
var showRaysElement = document.getElementById("show_rays");
var showValidRangeElement = document.getElementById("show_valid_range");
var minValidRangeElement = document.getElementById("min_valid_range");
var maxValidRangeElement = document.getElementById("max_valid_range");
var showCollidingElement = document.getElementById("show_colliding_rays");
var listOfBeaconsElement = document.getElementById("list_of_beacons");
var listOfBeaconsTitleElement = document.getElementById("list_of_beacons_title");
var worldCenterXElement = document.getElementById("center_x");
var worldCenterYElement = document.getElementById("center_y");
radiusElement === null || radiusElement === void 0 ? void 0 : radiusElement.addEventListener("change", function (ev) {
    var el = ev.target;
    globalConfig.BlockInPx = WIDTH / el.valueAsNumber;
    // It doesn't really make sense on a grid to have a center of block in between 2 blocks, so we only allow odd numbers as radius
    // now to think of it... only the diameter needs to be odd, the radius can be even (since 2x anything will always be even 2x%2 always equals 0 right?)
    // but it ... works? sooooo ... I'll just leave it like this :D
    if (el.valueAsNumber % 2 == 0) {
        globalConfig.RadiusInBlock = el.valueAsNumber + 1;
    }
    else {
        globalConfig.RadiusInBlock = el.valueAsNumber;
    }
    globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
});
minValidRangeElement === null || minValidRangeElement === void 0 ? void 0 : minValidRangeElement.addEventListener("change", function (ev) {
    var el = ev.target;
    globalConfig.ValidRange[0] = el.valueAsNumber * BLOCK_IN_PX;
    globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
    generateListOfBeacons();
});
worldCenterXElement === null || worldCenterXElement === void 0 ? void 0 : worldCenterXElement.addEventListener("change", function (ev) {
    var el = ev.target;
    console.log(el.valueAsNumber);
    globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
    globalConfig.worldStartX = el.valueAsNumber - globalConfig.RadiusInBlock;
    generateListOfBeacons();
});
worldCenterYElement === null || worldCenterYElement === void 0 ? void 0 : worldCenterYElement.addEventListener("change", function (ev) {
    var el = ev.target;
    globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
    globalConfig.worldStartY = el.valueAsNumber - globalConfig.RadiusInBlock;
    generateListOfBeacons();
});
maxValidRangeElement === null || maxValidRangeElement === void 0 ? void 0 : maxValidRangeElement.addEventListener("change", function (ev) {
    var el = ev.target;
    globalConfig.ValidRange[1] = el.valueAsNumber * BLOCK_IN_PX;
    globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
    generateListOfBeacons();
});
raysElement === null || raysElement === void 0 ? void 0 : raysElement.addEventListener("change", function (ev) {
    var el = ev.target;
    globalConfig.RaysCount = el.valueAsNumber;
    globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
    generateListOfBeacons();
});
thetaElement === null || thetaElement === void 0 ? void 0 : thetaElement.addEventListener("change", function (ev) {
    var el = ev.target;
    globalConfig.InitialTheta = el.valueAsNumber;
    globalGrid = generateGrid(globalConfig.RadiusInBlock, globalConfig.RaysCount);
    generateListOfBeacons();
});
function draw(ctx) {
    ctx.clearRect(0, 0, globalConfig.Width, globalConfig.Height);
    globalGrid.draw(ctx);
    if (showValidRangeElement === null || showValidRangeElement === void 0 ? void 0 : showValidRangeElement.checked) {
        drawCircle(ctx, globalConfig.Width / 2, globalConfig.Height / 2, globalConfig.ValidRange[0]);
        drawCircle(ctx, globalConfig.Width / 2, globalConfig.Height / 2, globalConfig.ValidRange[1]);
    }
    globalGrid.blocks[Math.floor(globalGrid.blocks.length / 2)].fillColor = "#000000";
}
function initCtx() {
    var canvas = document.getElementById("canvas");
    if (canvas == null) {
        return;
    }
    var ctx = canvas.getContext("2d");
    if (ctx == null) {
        return;
    }
    return ctx;
}
function generateListOfBeacons() {
    var count = 0;
    listOfBeaconsElement.innerHTML = "";
    for (var i = 0; i < globalGrid.blocks.length; i++) {
        if (globalGrid.blocks[i].isClosestToRay) {
            count++;
            // Math.floor should not be used but I'm worried about floating point precision when mul then div
            var xCoordInBlockIndex = Math.floor(globalGrid.blocks[i].x / globalConfig.BlockInPx);
            var yCoordInBlockIndex = Math.floor(globalGrid.blocks[i].y / globalConfig.BlockInPx);
            var li = document.createElement('li');
            console.log(globalConfig.worldStartX, globalConfig.worldStartY, xCoordInBlockIndex, yCoordInBlockIndex, globalGrid.blocks[i]);
            li.appendChild(document.createTextNode("x:" + (globalConfig.worldStartX + xCoordInBlockIndex) + " y:" + (globalConfig.worldStartY + yCoordInBlockIndex)));
            listOfBeaconsElement.appendChild(li);
        }
    }
    listOfBeaconsTitleElement.innerHTML = "List of beacons (" + count + ")";
}
function doesCollide(ray, block) {
    return lineRect(ray.x, ray.y, ray.x2, ray.y2, block.x, block.y, block.size, block.size);
}
function newRay(x, y, angle) {
    var distance = (globalConfig.BlockInPx * globalConfig.RadiusInBlock) / 2 +
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
function drawRay(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = "#55FF00";
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
    ctx.closePath();
}
function generateGrid(side, raysCount) {
    var g = {};
    g.blocks = [];
    g.draw = drawGrid;
    g.rays = [];
    for (var x = 0; x < side; x++) {
        for (var y = 0; y < side; y++) {
            var b = generateBlock(x, y);
            g.blocks.push(b);
        }
    }
    var midBlock = g.blocks[Math.floor(g.blocks.length / 2)];
    var mid = midBlock.x + midBlock.size / 2;
    var angleIncrement = (2 * Math.PI) / raysCount;
    for (var rayIndex = 0; rayIndex < raysCount; rayIndex++) {
        var angle = angleIncrement * rayIndex + globalConfig.InitialTheta;
        var ray = newRay(mid, mid, angle);
        var closestToRay = { distance: g.blocks[0].size, blockIndex: 0 };
        for (var blockIndex = 0; blockIndex < g.blocks.length; blockIndex++) {
            var blockCenterX = (g.blocks[blockIndex].x + g.blocks[blockIndex].size / 2);
            var blockCenterY = (g.blocks[blockIndex].y + g.blocks[blockIndex].size / 2);
            var distanceOfCenterX = blockCenterX - mid;
            var distanceOfCenterY = blockCenterY - mid;
            var hypotenuse = Math.sqrt(distanceOfCenterX * distanceOfCenterX + distanceOfCenterY * distanceOfCenterY);
            if (hypotenuse < globalConfig.ValidRange[0] || hypotenuse > globalConfig.ValidRange[1]) {
                continue;
            }
            if (!doesCollide(ray, g.blocks[blockIndex])) {
                continue;
            }
            ray.collidesWith.push(g.blocks[blockIndex]);
            g.blocks[blockIndex].isColliding = true;
            var distanceToRay = pDistance(blockCenterX, blockCenterY, ray.x, ray.y, ray.x2, ray.y2);
            if (distanceToRay < closestToRay.distance) {
                closestToRay = { distance: distanceToRay, blockIndex: blockIndex };
                continue;
            }
        }
        g.blocks[closestToRay.blockIndex].isClosestToRay = true;
        g.rays.push(ray);
    }
    return g;
}
function drawBlock(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.fillStyle = this.fillColor;
    ctx.strokeStyle = this.strokeColor;
    if (showGridElement.checked) {
        ctx.strokeRect(this.x, this.y, globalConfig.BlockInPx, globalConfig.BlockInPx);
    }
    ctx.fillRect(this.x, this.y, globalConfig.BlockInPx, globalConfig.BlockInPx);
    ctx.fill();
    ctx.closePath();
}
function generateBlock(x, y) {
    var b = {};
    b.x = x * globalConfig.BlockInPx;
    b.y = y * globalConfig.BlockInPx;
    b.size = globalConfig.BlockInPx;
    b.draw = drawBlock;
    b.fillColor = "#FFFFFF";
    b.strokeColor = "#FF5500";
    return b;
}
function drawGrid(ctx) {
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
function drawCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.strokeStyle = "#00FF00";
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
}
// ==== external function === 
// https://crhallberg.com/CollisionDetection/Website/line-rect.html
function lineLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    var uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) /
        ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    var uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) /
        ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        return true;
    }
    return false;
}
function lineRect(x1, y1, x2, y2, rx, ry, rw, rh) {
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

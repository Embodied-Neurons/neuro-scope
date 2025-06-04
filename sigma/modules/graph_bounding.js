const { CONTAINER_WIDTH, CONTAINER_HEIGHT } = require('./consts.js');


const calculateDynamicBounds = function(x, y, ratio, posInfo) {
    let newX, newY;
    let {minY, maxY} = findYExtremes(x, posInfo);
    newY = Math.max(Math.min(y, maxY), minY);

    if (ratio >= 0.6) {
        if (x - 0.4 * ratio > posInfo[posInfo.length - 2].x) {
            newX = posInfo[posInfo.length - 2].x + 0.4 * ratio;
        } else if (x + 0.4 * ratio < posInfo[1].x) {
            newX = posInfo[1].x - 0.4 * ratio;
        } else {
            newX = x;
        }
    } else {
        newX = Math.max(Math.min(x, posInfo[posInfo.length - 1].x), posInfo[0].x);
    }

    return {newX, newY};
}


function findYExtremes(x, posInfo) {
    let minY, maxY, buff;

    if (x < posInfo[0].x) {
        minY = posInfo[0].minY;
        maxY = posInfo[0].maxY;
        buff = 0.125 * (maxY - minY);
    } else if (x > posInfo[posInfo.length - 1].x) {
        minY = posInfo[posInfo.length - 1].minY;
        maxY = posInfo[posInfo.length - 1].maxY;
        buff = 0.125 * (maxY - minY);
    } else {
        for (let i = 0; i < posInfo.length - 1; i++) {
            if (x >= posInfo[i].x && x <= posInfo[i + 1].x) {
                const w1 = (x - posInfo[i].x) / (posInfo[i + 1].x - posInfo[i].x);
                const w2 = (posInfo[i + 1].x - x) / (posInfo[i + 1].x - posInfo[i].x);
                minY = w2 * posInfo[i].minY + w1 * posInfo[i + 1].minY;
                maxY = w2 * posInfo[i].maxY + w1 * posInfo[i + 1].maxY;
                buff = 0.125 * (maxY - minY);
                break;
            }
        }
    }

    return {minY: minY + buff, maxY: maxY - buff};
}


function getCenterCoords(renderer, container) {
    return renderer.viewportToGraph({
        x: container.offsetWidth / 2,
        y: container.offsetHeight / 2
    });
}


const getVisibilityRanges = function(camera, renderer, container) {
    const {ratio} = camera.getState();
    let {x, y} = getCenterCoords(renderer, container);

    x /= CONTAINER_WIDTH;
    y /= CONTAINER_HEIGHT;

    return {
        minX: x - 0.56 * ratio,
        maxX: x + 0.56 * ratio,
        minY: y - 0.6 * ratio,
        maxY: y + 0.6 * ratio
    }
}

module.exports = { calculateDynamicBounds, getVisibilityRanges };

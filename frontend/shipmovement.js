// Spatial partitioning grid
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    getKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    insert(item) {
        const pos = item.translation();
        const key = this.getKey(pos.x, pos.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(item);
    }

    getNearbyItems(x, y, radius) {
        const nearbyItems = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCellX = Math.floor(x / this.cellSize);
        const centerCellY = Math.floor(y / this.cellSize);

        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const key = `${centerCellX + dx},${centerCellY + dy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    nearbyItems.push(...cell);
                }
            }
        }

        return nearbyItems;
    }

    clear() {
        this.grid.clear();
    }
}

export function updateAutomatedShips(automatedShips, shipTargets, circles, targetPositions, automatedShipSpeed) {
    const grid = new SpatialGrid(200); // Cell size of 200 units
    circles.forEach(circle => grid.insert(circle));

    for (let i = 0; i < automatedShips.length; i++) {
        const ship = automatedShips[i];
        let currentTarget = shipTargets[i];

        if (currentTarget && (currentTarget.userData.removed || isCircleInCorrectArea(currentTarget, targetPositions))) {
            currentTarget.userData.isTargeted = false;
            shipTargets[i] = null;
            currentTarget = null;
        }

        if (!currentTarget || !currentTarget.userData.isTargeted) {
            const shipPos = ship.translation();
            const nearbyCandidates = grid.getNearbyItems(shipPos.x, shipPos.y, 1000);
            const nearestCircle = findNearestUntargetedCircle(ship, nearbyCandidates, targetPositions);
            if (nearestCircle) {
                shipTargets[i] = nearestCircle;
                nearestCircle.userData.isTargeted = true;
            }
        }

        if (shipTargets[i] && !shipTargets[i].userData.removed) {
            updateShipBehavior(ship, shipTargets[i], targetPositions, automatedShipSpeed);
        }
    }
}


export function isCircleInCorrectArea(circle, targetPositions, tolerance = 200) {
    if (circle.userData.removed) return false;

    const position = circle.translation();
    const target = targetPositions[circle.userData.material];
    return getSquaredDistance(position, target) <= tolerance * tolerance;
}

function findNearestUntargetedCircle(ship, circles, targetPositions) {
    let nearestCircle = null;
    let shortestDistanceSquared = Infinity;
    const shipPos = ship.translation();

    for (const circle of circles) {
        if (!circle.userData.isTargeted && !isCircleInCorrectArea(circle, targetPositions) && !circle.userData.removed) {
            const distanceSquared = getSquaredDistance(shipPos, circle.translation());
            if (distanceSquared < shortestDistanceSquared) {
                shortestDistanceSquared = distanceSquared;
                nearestCircle = circle;
            }
        }
    }

    return nearestCircle;
}

function updateShipBehavior(ship, circle, targetPositions, automatedShipSpeed) {
    const circlePos = circle.translation();
    const target = targetPositions[circle.userData.material];
    const distanceToTargetSquared = getSquaredDistance(circlePos, target);

    if (distanceToTargetSquared >= 2500) { // 50^2
        const shipPos = ship.translation();
        const distanceToCircleSquared = getSquaredDistance(circlePos, shipPos);

        if (distanceToCircleSquared < 900) { // 30^2
            pushCircleTowards(circle, target.x, target.y);
        } else {
            moveShipTowards(ship, circlePos.x, circlePos.y, automatedShipSpeed);
        }
    }
}

function getSquaredDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return dx * dx + dy * dy;
}

export function moveShipsTowards(automatedShips, targetX, targetY, speed){
    for (let i = 0; i < automatedShips.length; i++) {
        const ship = automatedShips[i];
        moveShipTowards(ship, targetX, targetY, speed)
    }
}



export function moveShipsInCircle(automatedShips, centerX, centerY, radius, speed) {
    const angleStep = (2 * Math.PI) / automatedShips.length; // Divide the circle into equal angles

    for (let i = 0; i < automatedShips.length; i++) {
        const angle = i * angleStep; // Calculate the angle for each ship
        const targetX = centerX + radius * Math.cos(angle); // Calculate the x coordinate of the point on the circle
        const targetY = centerY + radius * Math.sin(angle); // Calculate the y coordinate of the point on the circle
        
        // Move the ship towards the calculated point on the circle
        moveShipTowards(automatedShips[i], targetX, targetY, speed);
    }
}

export function moveShipsInFormation(automatedShips, leaderTargetX, leaderTargetY, spacing, speed) {
    if (automatedShips.length === 0) return;

    // Move the leader ship (first in the array) towards the target point
    const leaderPos = automatedShips[0].translation();
    moveShipTowards(automatedShips[0], leaderTargetX, leaderTargetY, speed);

    // Each subsequent ship follows the one in front of it
    for (let i = 1; i < automatedShips.length; i++) {
        const leadShip = automatedShips[i - 1];
        const followingShip = automatedShips[i];

        const leadPos = leadShip.translation();
        const followPos = followingShip.translation();

        // Calculate the target position behind the lead ship
        const angle = Math.atan2(leadPos.y - followPos.y, leadPos.x - followPos.x);
        const targetX = leadPos.x - spacing * Math.cos(angle);
        const targetY = leadPos.y - spacing * Math.sin(angle);

        // Move the following ship towards the calculated target position
        moveShipTowards(followingShip, targetX, targetY, speed);
    }
}



function moveShipTowards(ship, targetX, targetY, speed) {
    const position = ship.translation();
    const angle = Math.atan2(targetY - position.y, targetX - position.x);

    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    ship.setLinvel({ x: velocityX, y: velocityY }, true);
    ship.setRotation(angle);
}

function pushCircleTowards(circle, targetX, targetY) {
    const position = circle.translation();
    const angle = Math.atan2(targetY - position.y, targetX - position.x);
    const pushSpeed = 200;

    const velocityX = Math.cos(angle) * pushSpeed;
    const velocityY = Math.sin(angle) * pushSpeed;

    circle.setLinvel({ x: velocityX, y: velocityY }, true);
}
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
    const grid = new SpatialGrid(3000); // Cell size of 200 units
    // const unsortedCircles = circles.filter(circle => ! isCircleInCorrectArea(circle,targetPositions ))
    // unsortedCircles.forEach(circle => grid.insert(circle));
    circles.forEach(circle => grid.insert(circle));
    

    for (let i = 0; i < automatedShips.length; i++) {
        const ship = automatedShips[i];
        let currentTarget = shipTargets[i];

        if (currentTarget && (currentTarget.userData.removed || currentTarget.userData.isInCorrectArea )) {
            currentTarget.userData.isTargeted = false;
            shipTargets[i] = null;
            currentTarget = null;
        }

        if (!currentTarget || !currentTarget.userData.isTargeted) {
            const shipPos = ship.translation();
            let nearbyCandidates = grid.getNearbyItems(shipPos.x, shipPos.y, 1000);

            // Increase search radius dynamically if no candidates found
            let searchRadius = 1000;
            const maxRadius = 10000; // Define a reasonable maximum search radius
            while (nearbyCandidates.length === 0 && searchRadius <= maxRadius) {
                searchRadius += 1000; // Expand the radius by 1000 units
                nearbyCandidates = grid.getNearbyItems(shipPos.x, shipPos.y, searchRadius);
            }

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


// export function updateAutomatedShips(automatedShips, shipTargets, circles, targetPositions, automatedShipSpeed) {
//     const grid = new SpatialGrid(200); // Cell size of 200 units
//     circles.forEach(circle => grid.insert(circle));

//     for (let i = 0; i < automatedShips.length; i++) {
//         const ship = automatedShips[i];
//         let currentTarget = shipTargets[i];

//         if (currentTarget && (currentTarget.userData.removed || isCircleInCorrectArea(currentTarget, targetPositions))) {
//             currentTarget.userData.isTargeted = false;
//             shipTargets[i] = null;
//             currentTarget = null;
//         }

//         if (!currentTarget || !currentTarget.userData.isTargeted) {
//             const shipPos = ship.translation();
//             const nearbyCandidates = grid.getNearbyItems(shipPos.x, shipPos.y, 1000);
//             const nearestCircle = findNearestUntargetedCircle(ship, nearbyCandidates, targetPositions);
//             if (nearestCircle) {
//                 shipTargets[i] = nearestCircle;
//                 nearestCircle.userData.isTargeted = true;
//             }
//         }

//         if (shipTargets[i] && !shipTargets[i].userData.removed) {
//             updateShipBehavior(ship, shipTargets[i], targetPositions, automatedShipSpeed);
//         }
//     }
// }


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
        if (!circle.userData.isTargeted && !circle.userData.isInCorrectArea && !circle.userData.removed) {
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
        const shipPointToCirclePoint = (20 + circle.userData.radius)**2
        if (distanceToCircleSquared < shipPointToCirclePoint) { 
            pushCircleTowards(circle, target.x, target.y, automatedShipSpeed);
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



export function moveShipsInCircle(automatedShips, centerX, centerY, radius, speed, threshold = 0.001) {
    const angleStep = (2 * Math.PI) / automatedShips.length; // Divide the circle into equal angles
    const thresholdSquared = threshold * threshold; // Avoid using sqrt by working with squared distances

    for (let i = 0; i < automatedShips.length; i++) {
        const angle = i * angleStep; // Calculate the angle for each ship
        const targetX = centerX + radius * Math.cos(angle); // Calculate the x coordinate of the point on the circle
        const targetY = centerY + radius * Math.sin(angle); // Calculate the y coordinate of the point on the circle

        // Get the ship's current position
        const shipPos = automatedShips[i].translation();

        // Calculate the squared distance between the ship's position and the target position
        const dx = targetX - shipPos.x;
        const dy = targetY - shipPos.y;
        const distanceSquared = dx * dx + dy * dy;

        // If the distance is greater than the threshold, move the ship
        if (distanceSquared > thresholdSquared) {
            moveShipTowards(automatedShips[i], targetX, targetY, speed);
        }
        else{
            moveShipTowards(automatedShips[i], targetX, targetY, 50);
        }
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
    let vx = targetX - position.x;
    let vy = targetY - position.y;

    // Calculate the squared magnitude of the velocity vector (vx, vy)
    const magnitudeSquared = vx * vx + vy * vy;

    // If the magnitude squared is greater than 0, normalize the vector and apply the speed
    if (magnitudeSquared > 0) {
        // Avoid sqrt for comparison, but use it for normalization when applying speed
        const magnitude = Math.sqrt(magnitudeSquared);
        vx = (vx / magnitude) * speed;
        vy = (vy / magnitude) * speed;
    }

    // Set the linear velocity
    ship.setLinvel({ x: vx, y: vy }, true);

    // Set the rotation of the ship to face the target
    const angle = Math.atan2(vy, vx); // Angle based on the normalized velocity
    ship.setRotation(angle);
}



// function moveShipTowards(ship, targetX, targetY, speed) {
//     const position = ship.translation();
//     const angle = Math.atan2(targetY - position.y, targetX - position.x);

//     const velocityX = Math.cos(angle) * speed;
//     const velocityY = Math.sin(angle) * speed;

//     ship.setLinvel({ x: velocityX, y: velocityY }, true);
//     ship.setRotation(angle);
// }

function pushCircleTowards(circle, targetX, targetY, shipSpeed) {
    const position = circle.translation();
    const angle = Math.atan2(targetY - position.y, targetX - position.x);
    const pushSpeed = shipSpeed * 1.001;

    const velocityX = Math.cos(angle) * pushSpeed;
    const velocityY = Math.sin(angle) * pushSpeed;

    circle.setLinvel({ x: velocityX, y: velocityY }, true);
}
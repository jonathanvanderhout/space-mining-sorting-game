export function updateAutomatedShips(automatedShips, shipTargets, circles, targetPositions, automatedShipSpeed) {
    for (let i = 0; i < automatedShips.length; i++) {
        const ship = automatedShips[i];
        let currentTarget = shipTargets[i];

        // Check if current target is removed or in correct area
        if (currentTarget && (currentTarget.userData.removed || isCircleInCorrectArea(currentTarget, targetPositions))) {
            currentTarget.userData.isTargeted = false;
            shipTargets[i] = null;
            currentTarget = null;
        }

        // Find new target if needed
        if (!currentTarget || !currentTarget.userData.isTargeted) {
            const nearestCircle = findNearestUntargetedCircle(ship, circles, targetPositions);
            if (nearestCircle) {
                shipTargets[i] = nearestCircle;
                nearestCircle.userData.isTargeted = true;
            }
        }

        // Update ship behavior
        if (shipTargets[i] && !shipTargets[i].userData.removed) {
            updateShipBehavior(ship, shipTargets[i], targetPositions, automatedShipSpeed);
        }
    }
}

export function isCircleInCorrectArea(circle, targetPositions, tolerance = 200) {
    if (circle.userData.removed) {
        return false;
    }

    const position = circle.translation();
    const material = circle.userData.material;
    const target = targetPositions[material];

    const distance = getDistance(position, target);

    return distance <= tolerance;
}

function findNearestUntargetedCircle(ship, circles, targetPositions) {
    let nearestCircle = null;
    let shortestDistance = Infinity;

    for (const circle of circles) {
        if (!circle.userData.isTargeted && !isCircleInCorrectArea(circle, targetPositions) && !circle.userData.removed) {
            const distance = getDistance(ship.translation(), circle.translation());
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestCircle = circle;
            }
        }
    }

    return nearestCircle;
}

function updateShipBehavior(ship, circle, targetPositions, automatedShipSpeed) {
    const circlePos = circle.translation();
    const material = circle.userData.material;
    const target = targetPositions[material];

    const distanceToTarget = getDistance(circlePos, target);

    if (distanceToTarget >= 50) {
        const distanceToCircle = getDistance(circlePos, ship.translation());

        if (distanceToCircle < 30) {
            pushCircleTowards(circle, target.x, target.y);
        } else {
            moveShipTowards(ship, circlePos.x, circlePos.y, automatedShipSpeed);
        }
    }
}

function getDistance(pos1, pos2) {
    return Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y);
}
function moveShipTowards(ship, targetX, targetY, speed) {
    const position = ship.translation();
    const angle = Math.atan2(targetY - position.y, targetX - position.x);

    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    ship.setLinvel({ x: velocityX, y: velocityY }, true);
    ship.setRotation(angle);
}

// Function to manipulate circle's velocity towards target
function pushCircleTowards(circle, targetX, targetY) {
    const position = circle.translation();
    const angle = Math.atan2(targetY - position.y, targetX - position.x);
    const pushSpeed = 200;

    const velocityX = Math.cos(angle) * pushSpeed;
    const velocityY = Math.sin(angle) * pushSpeed;

    circle.setLinvel({ x: velocityX, y: velocityY }, true);
}

// Assume these functions are defined elsewhere in your code:
// pushCircleTowards(circle, x, y)
// moveShipTowards(ship, x, y, speed)
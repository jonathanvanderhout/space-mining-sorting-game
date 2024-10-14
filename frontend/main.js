import './style.css'

import * as RAPIER from '@dimforge/rapier2d-compat';
import * as drawing from './drawing.js';
import {isCircleInCorrectArea, updateAutomatedShips} from "./shipmovement.js"
(async () => {
    // Initialize Rapier physics engine
    await RAPIER.init();

    // Set up the canvas
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let gameWorldHeight =  1080
    let gameWorldWidth = 1920
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Variables for panning
    let isPanning = false;
    let startPan = { x: 0, y: 0 };
    let panOffset = { x: 0, y: 0 };

    // Event listeners for mouse interactions
    canvas.addEventListener('mousedown', (e) => {
        isPanning = true;
        const rect = canvas.getBoundingClientRect();
        startPan.x = e.clientX - rect.left;
        startPan.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate the movement
            const dx = (x - startPan.x) // scale;
            const dy = (y - startPan.y) // scale;

            // Update the origin for panning
            originX += dx;
            originY += dy;

            // Update the starting point
            startPan.x = x;
            startPan.y = y;

            // Redraw the canvas
            draw();
        }
    });

    canvas.addEventListener('mouseup', () => {
        isPanning = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isPanning = false;
    });

    // Optional: Support touch events for mobile devices
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isPanning = true;
            const rect = canvas.getBoundingClientRect();
            startPan.x = e.touches[0].clientX - rect.left;
            startPan.y = e.touches[0].clientY - rect.top;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (isPanning && e.touches.length === 1) {
            const rect = canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;

            const dx = (x - startPan.x) / scale;
            const dy = (y - startPan.y) / scale;

            originX += dx;
            originY += dy;

            startPan.x = x;
            startPan.y = y;

            draw();
        }
    });

    canvas.addEventListener('touchend', () => {
        isPanning = false;
    });


    // Variables for canvas zoom and pan
    let scale = 1;
    let originX = 0;
    let originY = 0;
    const minScale = 0.5;
    const maxScale = 2.5;
    function draw() {
        // Clear the canvas
        ctx.clearRect(0, 0, width, height);

        // Save the context state
        ctx.save();

        // Apply transformations
        ctx.translate(originX, originY);
        ctx.scale(scale, scale);


        // Draw red rings
        redRings.forEach(ring => {
            ctx.beginPath();
            ctx.arc(ring.x, ring.y, ring.radius, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 5;
            ctx.stroke();
        });

        // Update and draw ghost rings
        for (let i = ghostRings.length - 1; i >= 0; i--) {
            const ghostRing = ghostRings[i];
            ghostRing.radius *= 1.1;
            ghostRing.opacity *= 0.9;
            if (ghostRing.opacity <= 0.1 || ghostRing.radius >= 100) {
                ghostRings.splice(i, 1);
            } else {
                ctx.beginPath();
                ctx.arc(ghostRing.x, ghostRing.y, ghostRing.radius, 0, 2 * Math.PI);
                ctx.strokeStyle = `rgba(255, 255, 0, ${ghostRing.opacity})`;
                ctx.lineWidth = 5;
                ctx.stroke();
            }
        }

        // Update and draw ghost circles
        for (let i = ghostCircles.length - 1; i >= 0; i--) {
            const ghostCircle = ghostCircles[i];
            ghostCircle.radius *= 0.9;
            ghostCircle.opacity *= 0.9;
            if (ghostCircle.opacity <= 0.1 || ghostCircle.radius <= 1) {
                ghostCircles.splice(i, 1);
            } else {
                ctx.beginPath();
                ctx.arc(ghostCircle.x, ghostCircle.y, ghostCircle.radius, 0, 2 * Math.PI);
                ctx.fillStyle = ghostCircle.color;
                ctx.globalAlpha = ghostCircle.opacity;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }


        drawing.drawCircles(ctx, circles)

        automatedShips.forEach(body => {
            const position = body.translation();
            ctx.save();
            ctx.translate(position.x, position.y);
            ctx.rotate(body.rotation());
            ctx.beginPath();
            // Draw the diamond shape
            ctx.moveTo(-20, 0);
            ctx.lineTo(0, -10);
            ctx.lineTo(20, 0);
            ctx.lineTo(0, 10);
            ctx.closePath();
            ctx.fillStyle = body.userData.color;
            ctx.fill();
            ctx.restore();
        });

        const position = playerShip.translation();
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(playerShip.rotation());
        ctx.beginPath();
        const radius = 23;
        ctx.moveTo(radius, 0);
        for (let i = 1; i <= 6; i++) {
            const angle = (Math.PI / 3) * i;
            ctx.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fillStyle = playerShip.userData.color;
        ctx.fill();
        ctx.restore();

        // Restore the context state
        ctx.restore();
    }


    canvas.addEventListener('wheel', (e) => {
        // console.log(e)
        // Check if Ctrl key is not pressed
        if (!e.ctrlKey) {
            e.preventDefault();

            // Normalize the wheel delta
            const delta = -e.deltaY || e.wheelDelta || e.detail;
            const zoomFactor = 1.05;
            let zoom = delta > 0 ? zoomFactor : 1 / zoomFactor;

            // Calculate the new scale
            const newScale = scale * zoom;
            if (newScale < minScale || newScale > maxScale) {
                return;
            }

            // Get the mouse position on the canvas
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - originX;
            const mouseY = e.clientY - rect.top - originY;

            // Adjust the origin to zoom toward the mouse pointer
            originX -= mouseX * (zoom - 1);
            originY -= mouseY * (zoom - 1);

            // Update the scale
            scale = newScale;

            // Redraw the canvas
            draw();
        }
    }, { passive: false });


    // Create a Rapier world with no gravity
    const gravity = { x: 0, y: 0 };
    const world = new RAPIER.World(gravity);


    // Variables for game state
    const automatedShips = [];
    const circles = [];
    let money = 0;
    let totalMoneySpent = 0;
    let shipsPurchased = 1; // Start with one ship
    const maxShips = 100;
    let speedIncreases = 0;
    const maxSpeedIncreases = 5;
    let automatedShipSpeed = 100;
    let shipTargets = [];
    let gravityCollectorPurchased = false;
    let gravityCollectorStrength = 1;
    let gravityCollectorActive = false;
    let gameWon = false;
    let funnyMessageTimeout = null;
    let startTime = null;
    const ghostRings = [];
    const ghostCircles = [];
    const redRings = [];

    // Create boundaries (static rigid bodies)
    const boundaries = [
        { x: gameWorldWidth / 2, y: 0, w: gameWorldWidth, h: 10 },                 // Top
        { x: gameWorldWidth / 2, y: gameWorldHeight, w: gameWorldWidth, h: 10 },            // Bottom
        { x: 0, y: gameWorldHeight / 2, w: 10, h: gameWorldHeight },               // Left
        { x: gameWorldWidth, y: gameWorldHeight / 2, w: 10, h: gameWorldHeight },           // Right
    ];

    // boundaries.forEach(boundary => {
    //     const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(boundary.x, boundary.y);
    //     const body = world.createRigidBody(bodyDesc);
    //     const colliderDesc = RAPIER.ColliderDesc.cuboid(boundary.w / 2, boundary.h / 2);
    //     world.createCollider(colliderDesc, body);
    // });

    // Define materials
    const materials = [
        { name: 'water', color: '#00FFFF' },
        { name: 'iron', color: '#A9A9A9' },
        { name: 'gold', color: '#FFD700' },
        { name: 'uranium', color: '#00FF00' }
    ];

    // Target positions for sorting
    const targetPositions = {
        'water': { x: gameWorldWidth / 4, y: gameWorldHeight / 4 },
        'iron': { x: (3 * gameWorldWidth) / 4, y: gameWorldHeight / 4 },
        'gold': { x: gameWorldWidth / 4, y: (3 * gameWorldHeight) / 4 },
        'uranium': { x: (3 * gameWorldWidth) / 4, y: (3 * gameWorldHeight) / 4 },
    };

    // Ship creation
    const shipVertices = [
        { x: 0, y: 0 },
        { x: 20, y: -10 },
        { x: 40, y: 0 },
        { x: 20, y: 10 }
    ];

    // Function to create a ship (diamond-shaped)
    function createShip(x, y, color) {
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y)
            .setLinearDamping(5)
            .setAngularDamping(5);

        const body = world.createRigidBody(bodyDesc);

        // Convert shipVertices to a flat array
        const points = [];
        shipVertices.forEach(vertex => {
            points.push(vertex.x - 20); // Center the shape
            points.push(vertex.y);
        });

        const colliderDesc = RAPIER.ColliderDesc.convexHull(points);
        colliderDesc.setRestitution(0.5);
        world.createCollider(colliderDesc, body);

        body.userData = { color };
        automatedShips.push(body);
        shipTargets.push(null);
        return body;
    }

    // Function to create player-controlled hexagon ship
    function createHexagonShip(x, y, color) {
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y)
            .setLinearDamping(5)
            .setAngularDamping(5);
        const body = world.createRigidBody(bodyDesc);

        // Construct a flat array of numbers for the convex hull points
        const points = [];
        const radius = 23;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            points.push(radius * Math.cos(angle));
            points.push(radius * Math.sin(angle));
        }

        const colliderDesc = RAPIER.ColliderDesc.convexHull(points);
        colliderDesc.setRestitution(0.5);
        world.createCollider(colliderDesc, body);
        body.userData = { color };
        return body;
    }

    // Create initial automated ship
    for (let i = 0; i < 100; i++) {
      createShip(gameWorldWidth / 2, gameWorldHeight / 2, '#FF4500');

  }


    // Create player ship
    const playerShip = createHexagonShip(gameWorldWidth / 2 - 100, gameWorldHeight / 2 - 100, '#32CD32');

    // Function to generate circles (materials)
    function generateCircles(count) {
        for (let i = 0; i < count; i++) {
            const material = materials[Math.floor(Math.random() * materials.length)];

            // Random placement around the player ship
            let offsetDistance = 80;
            let angle = Math.random() * Math.PI * 2;
            let offsetX = Math.cos(angle) * offsetDistance;
            let offsetY = Math.sin(angle) * offsetDistance;

            let circleX = playerShip.translation().x + offsetX;
            let circleY = playerShip.translation().y + offsetY;

            const margin = 30;
            circleX = Math.min(Math.max(circleX, margin), gameWorldWidth - margin);
            circleY = Math.min(Math.max(circleY, margin), gameWorldHeight - margin);

            const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(circleX, circleY)
                .setLinearDamping(1); // Increase this value to make circles slow down faster
            const body = world.createRigidBody(bodyDesc);
            const colliderDesc = RAPIER.ColliderDesc.ball(10);
            colliderDesc.setRestitution(0.7);
            const collider = world.createCollider(colliderDesc, body);
            body.userData = {
                color: material.color,
                material: material.name,
                isTargeted: false,
                collider: collider,
                radius: 10,
                removed: false
            };
            circles.push(body);

            // Create a ghost ring for visual effect
            setTimeout(() => {
                createGhostRing(circleX, circleY);
            }, 50);
        }
    }

    function createGhostRing(x, y) {
        const ghostRing = {
            x: x,
            y: y,
            radius: 10,
            opacity: 1
        };
        ghostRings.push(ghostRing);
    }

    generateCircles(1000 );

    // Function to move automated ships
    // function moveShipTowards(ship, targetX, targetY, speed) {
    //     const position = ship.translation();
    //     const angle = Math.atan2(targetY - position.y, targetX - position.x);

    //     const velocityX = Math.cos(angle) * speed;
    //     const velocityY = Math.sin(angle) * speed;

    //     ship.setLinvel({ x: velocityX, y: velocityY }, true);
    //     ship.setRotation(angle);
    // }

    // // Function to manipulate circle's velocity towards target
    // function pushCircleTowards(circle, targetX, targetY) {
    //     const position = circle.translation();
    //     const angle = Math.atan2(targetY - position.y, targetX - position.x);
    //     const pushSpeed = 200;

    //     const velocityX = Math.cos(angle) * pushSpeed;
    //     const velocityY = Math.sin(angle) * pushSpeed;

    //     circle.setLinvel({ x: velocityX, y: velocityY }, true);
    // }

    // Function to check if a circle is in the correct area
    // function isCircleInCorrectArea(circle, tolerance_starting = 200) {
    //     if (circle.userData.removed) {
    //         return false;
    //     }

    //     const position = circle.translation();
    //     const material = circle.userData.material;
    //     const target = targetPositions[material];

    //     const tolerance = tolerance_starting;
    //     const distance = Math.hypot(position.x - target.x, position.y - target.y);

    //     if (distance <= tolerance) {
    //         circle.userData.isTargeted = false;
    //         return true;
    //     }

    //     return false;
    // }

    // Update automation logic for ships to push circles
    function updateAutomation() {
        if (circles.length < 10) {
            generateCircles(1);
        }
        updateAutomatedShips(automatedShips, shipTargets, circles, targetPositions, automatedShipSpeed)
    }

    // Function to check the win condition
    function checkWinCondition() {
        let allCirclesCorrect = true;
        money = 0;

        for (let i = 0; i < circles.length; i++) {
            const circle = circles[i];
            if (isCircleInCorrectArea(circle,targetPositions)) {
                money++;
            } else {
                allCirclesCorrect = false;
            }
        }

        updateMoney();

        // if (allCirclesCorrect && !gameWon && circles.length >= 300) {
        //     let message = document.getElementById('message')
        //     message.style.display = 'block';

        //     const now = new Date();
        //     const elapsedTimeFormatted = formatElapsedTime(startTime);
        //     const elapsedTimeInSeconds = Math.floor((now - startTime) / 1000);
        //     message.innerHTML = `Congratulations, you have fully sorted ${circles.length} resources in ${elapsedTimeFormatted}`
        //     gameWon = true;

        //     storeBestTime(elapsedTimeInSeconds);
        //     showPlayAgainButton();
        // } else if (!allCirclesCorrect && gameWon) {
        //     gameWon = false;
        //     document.getElementById('message').style.display = 'none';
        //     showFunnyMessage();
        // }
    }

    // Update money and buttons
    function updateMoney() {
        let elapsedTime = '';
        if (startTime) {
            elapsedTime = formatElapsedTime(startTime);
        } else {
            elapsedTime = '00:00';
        }

        document.getElementById('money-stats').innerHTML = `Sorted Resources: ${money}
<br>Total Resources Spent: ${totalMoneySpent}
<br>Total Unsorted: ${circles.length - money}
<br>Time Elapsed: ${elapsedTime}`;
        updateButtons();
    }

    function updateButtons() {
        const increaseSpeedButton = document.getElementById('increase-speed');
        const buyShipButton = document.getElementById('buy-ship');
        const buyGravityCollectorButton = document.getElementById('buy-gravity-collector');
        const randomDeliveryButton = document.getElementById('random-delivery');

        increaseSpeedButton.disabled = money < 5 || speedIncreases >= maxSpeedIncreases;
        buyShipButton.disabled = money < 15 || shipsPurchased >= maxShips;
        buyGravityCollectorButton.disabled = money < 50;
        randomDeliveryButton.disabled = money < 5 || circles.length >= 300;

        // Update button text with counts
        increaseSpeedButton.innerHTML = `Speed Increase (cost: 5) ${speedIncreases}/${maxSpeedIncreases}`;
        buyShipButton.innerHTML = `Buy New Ship (cost: 15) ${shipsPurchased}/${maxShips}`;
    }

    function formatElapsedTime(startTime) {
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);

        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function formatTimeFromSeconds(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}`;
    }

    function getRandomColor() {
        const colors = ['#FF4500', '#4169E1', '#FFD700', '#00FF00', '#FF69B4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Event listeners for buttons
    document.getElementById('buy-gravity-collector').addEventListener('click', () => {
        const cost = 50;
        if (money >= cost) {
            money -= cost;
            totalMoneySpent += cost;
            updateMoney();
            activateGravityCollector();
        }
    });

    document.getElementById('increase-speed').addEventListener('click', () => {
        if (money >= 5 && speedIncreases < maxSpeedIncreases) {
            money -= 5;
            totalMoneySpent += 5;
            automatedShipSpeed += 25;
            speedIncreases += 1;
            removeSortedCircles(5);
            updateMoney();

            if (speedIncreases >= maxSpeedIncreases) {
                document.getElementById('increase-speed').disabled = true;
            }
        }
    });

    document.getElementById('buy-ship').addEventListener('click', () => {
        const cost = 15;
        if (money >= cost && shipsPurchased < maxShips) {
            money -= cost;
            totalMoneySpent += cost;
            removeSortedCircles(15);
            const newShip = createShip(gameWorldWidth / 2, gameWorldHeight / 2, getRandomColor());
            shipsPurchased += 1;
            updateMoney();

            if (shipsPurchased >= maxShips) {
                document.getElementById('buy-ship').disabled = true;
            }
        }
    });

    document.getElementById('random-delivery').addEventListener('click', () => {
        if (money >= 5 && circles.length < 300) {
            removeSortedCircles(5);
            money -= 5;
            totalMoneySpent += 5;
            generateCircles(20);
            updateMoney();
        }
    });

    function removeSortedCircles(numToRemove) {
        let removedCount = 0;
        totalMoneySpent += numToRemove;

        for (let i = circles.length - 1; i >= 0 && removedCount < numToRemove; i--) {
            const circle = circles[i];
            if (isCircleInCorrectArea(circle, targetPositions)) {
                const circlePosition = { x: circle.translation().x, y: circle.translation().y };
                const circleColor = circle.userData.color;
                const radius = circle.userData.radius;

                circle.userData.isTargeted = false;

                for (let j = 0; j < shipTargets.length; j++) {
                    if (shipTargets[j] === circle) {
                        shipTargets[j] = null;
                    }
                }

                circle.userData.removed = true;

                world.removeRigidBody(circle);
                circles.splice(i, 1);
                removedCount++;

                // Create a "ghost" circle for the visual effect
                const ghostCircle = {
                    x: circlePosition.x,
                    y: circlePosition.y,
                    radius: radius * 1.2,
                    color: circleColor,
                    opacity: 1
                };
                ghostCircles.push(ghostCircle);
            }
        }
    }

    function addRedRings() {
        const ringRadius = 150;
        for (let key in targetPositions) {
            const pos = targetPositions[key];
            redRings.push({ x: pos.x, y: pos.y, radius: ringRadius });
        }
    }

    // Function to activate gravity collector
    function activateGravityCollector() {
        removeSortedCircles(50);
        if (gravityCollectorPurchased) {
            gravityCollectorStrength += 1;
            document.getElementById("buy-gravity-collector").innerHTML = `Upgrade Gravity Collector to level ${gravityCollectorStrength + 1} (cost 50)`;
            return;
        }
        gravityCollectorPurchased = true;
        gravityCollectorActive = true;
        document.getElementById("buy-gravity-collector").innerHTML = `Upgrade Gravity Collector to level ${gravityCollectorStrength + 1} (cost 50)`;
        addRedRings();

        // Start applying gravity collector forces
        // Since Rapier.js doesn't have the same event system as Matter.js, we'll call gravityCollectorForce() in the game loop
    }

    // Function to apply gravity collector forces
    function gravityCollectorForce() {
        circles.forEach(circle => {
            circle.resetForces(true)
            if (!isCircleInCorrectArea(circle, targetPositions, 100) && !circle.userData.removed) {
                const material = circle.userData.material;
                const target = targetPositions[material];
                const circlePos = circle.translation();
                const angle = Math.atan2(target.y - circlePos.y, target.x - circlePos.x);
                const forceMagnitude = 10000.5 * gravityCollectorStrength;

                const forceX = Math.cos(angle) * forceMagnitude;
                const forceY = Math.sin(angle) * forceMagnitude;

                // Apply force to the circle
                circle.addForce({ x: forceX, y: forceY }, true);
            }
        });
    }

    function storeBestTime(timeInSeconds) {
        let bestTimes = localStorage.getItem('bestTimes');

        if (bestTimes) {
            bestTimes = JSON.parse(bestTimes);
        } else {
            bestTimes = [];
        }

        bestTimes.push(timeInSeconds);

        bestTimes.sort(function (a, b) {
            return a - b;
        });

        if (bestTimes.length > 5) {
            bestTimes = bestTimes.slice(0, 5);
        }

        localStorage.setItem('bestTimes', JSON.stringify(bestTimes));
    }

    function showPlayAgainButton() {
        const moneyDisplay = document.getElementById('money-display');
        if (!document.getElementById('play-again-button')) {
            const playAgainButton = document.createElement('button');
            playAgainButton.id = 'play-again-button';
            playAgainButton.innerHTML = 'Play Again';
            playAgainButton.className = 'speed-button';
            playAgainButton.style.marginTop = '10px';
            playAgainButton.addEventListener('click', function () {
                location.reload();
            });

            moneyDisplay.appendChild(playAgainButton);
        }
    }

    function displayBestTimes() {
        let bestTimes = localStorage.getItem('bestTimes');

        if (bestTimes) {
            bestTimes = JSON.parse(bestTimes);
        } else {
            bestTimes = [];
        }

        const bestTimesList = document.getElementById('best-times-list');
        bestTimesList.innerHTML = '';

        for (let i = 0; i < bestTimes.length; i++) {
            const timeInSeconds = bestTimes[i];
            const formattedTime = formatTimeFromSeconds(timeInSeconds);
            const listItem = document.createElement('li');
            listItem.innerText = `${i + 1}. ${formattedTime}`;
            bestTimesList.appendChild(listItem);
        }
    }

    function showFunnyMessage() {
        const funnyMessage = document.getElementById('funny-message');
        funnyMessage.style.opacity = '1';

        if (funnyMessageTimeout) {
            clearTimeout(funnyMessageTimeout);
        }

        funnyMessageTimeout = setTimeout(() => {
            funnyMessage.style.opacity = '0';
        }, 3000);
    }

    // Control player ship with WASD keys
    const wasdKeys = { w: false, s: false, a: false, d: false };

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') wasdKeys.w = true;
        if (e.code === 'KeyS') wasdKeys.s = true;
        if (e.code === 'KeyA') wasdKeys.a = true;
        if (e.code === 'KeyD') wasdKeys.d = true;
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW') wasdKeys.w = false;
        if (e.code === 'KeyS') wasdKeys.s = false;
        if (e.code === 'KeyA') wasdKeys.a = false;
        if (e.code === 'KeyD') wasdKeys.d = false;
    });

    function controlPlayerShip() {
        const speed = 200;
        let vx = 0;
        let vy = 0;

        if (wasdKeys.w) vy -= speed;
        if (wasdKeys.s) vy += speed;
        if (wasdKeys.a) vx -= speed;
        if (wasdKeys.d) vx += speed;

        playerShip.setLinvel({ x: vx, y: vy }, true);
    }

    
    function resizeCanvas() {
        

        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;

        // Adjust the scale to fit the game world into the canvas
        const scaleX = width / gameWorldWidth;
        const scaleY = height / gameWorldHeight;
        scale = Math.min(scaleX, scaleY);

        // Center the game world in the canvas
        originX = (width - gameWorldWidth * scale) / 2;
        originY = (height - gameWorldHeight * scale) / 2;

        draw();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    // Main game loop
    function gameLoop() {
        if (gameStarted) {
            controlPlayerShip();
            updateAutomation();

            checkWinCondition();
            world.step();

            if (gravityCollectorActive) {
                gravityCollectorForce();
            }
        }

        // ctx.clearRect(0, 0, width, height);
        draw()

        requestAnimationFrame(gameLoop);
    }

    // Display best times when the instruction screen is shown
    displayBestTimes();

    // Handle Begin button click
    var gameStarted = false
    document.getElementById('begin-button').addEventListener('click', () => {
        document.getElementById('instruction-screen').style.display = 'none';
        gameStarted = true;
        startTime = new Date();
        gameLoop();
    });

})();
const adminToggleButton = document.getElementById('admin-panel-toggle');
const adminPanel = document.getElementById('admin-panel');

// Add a click event listener to the toggle button
adminToggleButton.addEventListener('click', () => {
    // Toggle the 'collapsed' class on the admin panel
    adminPanel.classList.toggle('collapsed');

    // Optionally, change the button text or icon
    if (adminPanel.classList.contains('collapsed')) {
        // adminToggleButton.textContent = 'Open Admin Panel';
    } else {
        // adminToggleButton.textContent = 'Close Admin Panel';
    }
});


// document.querySelector('#app').innerHTML = `
//   <div>
//     <a href="https://vitejs.dev" target="_blank">
//       <img src="${viteLogo}" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
//       <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
//     </a>
//     <h1>Hello Vite!</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite logo to learn more
//     </p>
//   </div>
// `

// setupCounter(document.querySelector('#counter'))

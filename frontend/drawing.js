export function drawCircles(ctx, circles) {
    circles.forEach(body => {
        if (body.userData.removed) return;

        const position = body.translation();
        const radius = body.userData.radius;

        // Draw white border
        // ctx.beginPath();
        // ctx.arc(position.x, position.y, radius + 1, 0, 2 * Math.PI);
        // ctx.fillStyle = 'white';
        // ctx.fill();

        // Draw circle
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = body.userData.color;
        ctx.fill();
    });
}
export function drawSquares(ctx, squares) {
    squares.forEach(body => {
        if (body.userData.removed) return;

        const position = body.translation();
        const size = body.userData.size;

        // Draw square
        ctx.beginPath();
        ctx.rect(position.x - size / 2, position.y - size / 2, size, size);  // Draw square centered at position
        ctx.fillStyle = body.userData.color;
        ctx.fill();
    });
}
export function drawPirateShips(ctx, pirateShips, pirateShipScale){
    pirateShips.forEach(body => {
        if (body.userData.isDestroyed) return;
  
        const position = body.translation();
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(body.rotation());
  
        // Draw the triangle shape
        ctx.beginPath();
        ctx.moveTo(0 * pirateShipScale, -20 * pirateShipScale);  // Tip of the triangle
        ctx.lineTo(-10 * pirateShipScale, 20 * pirateShipScale); // Left base
        ctx.lineTo(10 * pirateShipScale, 20 * pirateShipScale);  // Right base
        ctx.closePath();
        ctx.fillStyle = body.userData.color;
        ctx.fill();
        ctx.restore();
      });
}

export function drawRing(ctx, radius, x,y){
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 50;
    ctx.stroke();
}

export function drawResourceAreas(ctx, targetPositions, materials, radius) {
    materials.forEach(material => {
        const { name, color } = material;
        const { x, y } = targetPositions[name];
        drawEnhancedFadingCircle(ctx, x, y, radius, color, name);
    });
}

function drawEnhancedFadingCircle(ctx, x, y, radius, color, name) {
    // Create radial gradient
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // Parse the color to get its RGB components
    const rgbColor = hexToRgb(color);

    // Define gradient stops for a glowing effect
    gradient.addColorStop(0, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.5)`);
    gradient.addColorStop(0.7, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.2)`);
    gradient.addColorStop(1, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0)`);

    // Draw the main fading circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add a subtle outer glow
    const outerGlow = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.2);
    outerGlow.addColorStop(0, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.1)`);
    outerGlow.addColorStop(1, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius * 1.2, 0, 2 * Math.PI);
    ctx.fillStyle = outerGlow;
    ctx.fill();

    // Add "location" text at the top of the circle
    ctx.font = `${radius * 0.2}px Arial`;
    ctx.fillStyle = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, y - radius - 10); // Position the text above the circle
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b, a) => r + r + g + g + b + b + (a ? a + a : ''));
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: result[4] ? parseInt(result[4], 16) / 255 : 1
    } : null;
}

function drawFadingCircle(ctx, x, y, radius, color) {
    // Create radial gradient
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // Define gradient stops for a fading effect using the material color
    gradient.addColorStop(0, `${color}80`);   // More opaque in the center (adding 80 hex for transparency)
    gradient.addColorStop(1, `${color}00`);   // Fully transparent at the edges

    // Draw the fading circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
}


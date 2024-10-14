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
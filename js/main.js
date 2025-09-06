function main() {
    /** Page setup */
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    /** Game init */
    const caves = new CaveWorld();

    /** Mouse-related event listeners */
    let mousePosition;
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        mousePosition = { x, y };
    });

    canvas.addEventListener('mouseleave', () => {
        mousePosition = undefined;
    });

    canvas.addEventListener('click', e => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        mousePosition = { x, y };

        caves.click(canvas, mousePosition);
    });

    /** Keyboard event listeners */
    let keyboardState = {};
    window.addEventListener('keydown', e => {
        keyboardState[e.key] = true;
    });

    window.addEventListener('keyup', e => {
        delete keyboardState[e.key];
    });

    window.addEventListener('blur', () => {
        keyboardState = {};
    });

    /** Game loop */
    function loop() {
        caves.update(ctx, canvas, mousePosition, keyboardState);

        requestAnimationFrame(loop);
    }

    loop();
}

document.addEventListener('DOMContentLoaded', () => {
    main();
});

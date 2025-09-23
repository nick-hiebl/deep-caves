import { CaveWorld } from "./caveWorld";
import type { Vector } from "./core/math";

function main() {
    /** Page setup */
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;

    if (!canvas) {
        console.error('Could not find canvas');
        return;
    }

    const ctx = canvas.getContext('2d')!;

    if (!ctx) {
        console.error('');
        throw Error('Could not set up canvas rendering context');
    }

    ctx.imageSmoothingEnabled = false;

    /** Game init */
    const caves = new CaveWorld();

    /** Mouse-related event listeners */
    let mousePosition: Vector | undefined;
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
    let keyboardState: Record<string, boolean> = {};
    window.addEventListener('keydown', e => {
        keyboardState[e.key] = true;
        if (e.key === 'Tab' || e.key === ' ') {
            e.preventDefault();
        }
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

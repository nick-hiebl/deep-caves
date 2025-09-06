const FRAME_DURATION = 2;

const generateChoices = () => {
    return [
        new Segment(),
        new Segment(),
        new Segment(),
    ];
}

class CaveWorld {
    constructor() {
        this.worldMap = new WorldMap();

        this.lastFrameTime = performance.now();
        this.unprocessedTime = 0;

        this.paused = false;
        this.choosing = true;
        this.choices = [];

        this.mouseOverChoiceIndex = -1;
    }

    /** Update loop */
    update(ctx, canvas, mousePosition, keyboardState) {
        /** Choices setup */
        if (this.paused) {
            if (this.choices.length === 0) {
                this.choices = generateChoices();
            }

            this.draw(ctx, canvas, mousePosition);
            this.drawOptions(ctx, canvas, mousePosition);
            return;
        }

        /** Time computation */
        const currentTime = performance.now();
        const elapsedTime = Math.min(currentTime - this.lastFrameTime, 250);
        this.lastFrameTime = currentTime;

        this.unprocessedTime += elapsedTime;

        while (this.unprocessedTime >= FRAME_DURATION) {
            this.simulateFrame(mousePosition, keyboardState);

            this.unprocessedTime -= FRAME_DURATION;
        }

        const interpolationFactor = this.unprocessedTime / FRAME_DURATION;

        this.draw(ctx, canvas, mousePosition, interpolationFactor);
    }

    click(_canvas, _mousePosition) {
        const choosing = this.paused && this.choices.length > 0;
        const mousingOverValidOption = this.mouseOverChoiceIndex >= 0 && this.mouseOverChoiceIndex < this.choices.length;

        if (choosing && mousingOverValidOption) {
            this.paused = false;
            this.addLayer(new Layer(this.choices[this.mouseOverChoiceIndex]));
            this.choices = [];
        }
    }

    simulateFrame(mousePosition, keyboardState) {
        const room = this.worldMap.getCurrentRoom();
        room.update(mousePosition, keyboardState, FRAME_DURATION);
    }

    draw(ctx, canvas, mousePosition, interpolationFactor) {
        const room = this.worldMap.getCurrentRoom();

        room.draw(ctx, canvas, mousePosition, interpolationFactor);
    }

    drawOptions(ctx, canvas, mousePosition) {
        ctx.fillStyle = '#00000099';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.mouseOverChoiceIndex = -1;

        for (let i = 0; i < this.choices.length; i++) {
            const segment = this.choices[i];

            const width = canvas.width / this.choices.length;
            const left = i * width;
            const right = left + width;
            const middle = (left + right) / 2;

            ctx.save();
            ctx.translate(middle, (canvas.height + LAYER_HEIGHT) / 2);

            const mouseInside = mousePosition && left < mousePosition.x && mousePosition.x < right;
            if (mouseInside) {
                this.mouseOverChoiceIndex = i;
                ctx.scale(0.75, 0.75);
            } else {
                ctx.scale(0.6, 0.6);
            }

            segment.draw(ctx, canvas);

            ctx.restore();
        }
    }
}

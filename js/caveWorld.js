const FRAME_DURATION = 2;

const generateChoices = () => {
    return [
        new RoomChoice(),
        new RoomChoice(),
        new RoomChoice(),
    ];
}

class RoomChoice {
    constructor() {
        this.color = `hsl(${randint(0, 360)}, 60%, 60%)`;
    }

    draw(ctx, _canvas) {
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, 50, 50);
    }
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

        while (this.unprocessedTime >= FRAME_DURATION && !this.paused) {
            this.simulateFrame(mousePosition, keyboardState);

            this.unprocessedTime -= FRAME_DURATION;
        }

        if (this.paused) {
            this.unprocessedTime = 0;
        }

        const interpolationFactor = this.unprocessedTime / FRAME_DURATION;

        this.draw(ctx, canvas, mousePosition, interpolationFactor);
    }

    click(_canvas, _mousePosition) {
        const choosing = this.paused && this.choices.length > 0;
        const mousingOverValidOption = this.mouseOverChoiceIndex >= 0 && this.mouseOverChoiceIndex < this.choices.length;

        if (choosing && mousingOverValidOption) {
            const newRoom = new Room(this.worldMap.x, this.worldMap.y, 1, 1, this.choices[this.mouseOverChoiceIndex].color);
            this.worldMap.addRoom(newRoom);

            const lastRoom = this.worldMap.getPreviousRoom();
            this.transferPlayerPosition(lastRoom, newRoom);

            this.paused = false;
            this.choices = [];
        }
    }

    transferPlayerPosition(lastRoom, newRoom) {
        newRoom.playerState.xVelocity = lastRoom.playerState.xVelocity;
        newRoom.playerState.xVelocity = lastRoom.playerState.xVelocity;

        const worldX = lastRoom.playerState.actor.x + lastRoom.x * ROOM_SCALE_WIDTH;
        const worldY = lastRoom.playerState.actor.y + lastRoom.y * ROOM_SCALE_HEIGHT;

        newRoom.playerState.actor.x = worldX - newRoom.x * ROOM_SCALE_WIDTH;
        newRoom.playerState.actor.y = worldY - newRoom.y * ROOM_SCALE_HEIGHT;
    }

    simulateFrame(mousePosition, keyboardState) {
        const room = this.worldMap.getCurrentRoom();
        room.update(mousePosition, keyboardState, FRAME_DURATION, this.onRoomChange.bind(this));
    }

    onRoomChange(x, y) {
        if (this.worldMap.hasRoom(x, y)) {
            this.worldMap.enterRoom(x, y);

            this.transferPlayerPosition(this.worldMap.getPreviousRoom(), this.worldMap.getCurrentRoom());
        } else {
            this.paused = true;
            this.worldMap.enterRoom(x, y);
        }
    }

    draw(ctx, canvas, mousePosition, interpolationFactor) {
        const room = this.worldMap.getCurrentRoom();

        if (room) {
            room.draw(ctx, canvas, mousePosition, interpolationFactor);
        }
    }

    drawOptions(ctx, canvas, mousePosition) {
        ctx.fillStyle = '#00000099';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.mouseOverChoiceIndex = -1;

        for (let i = 0; i < this.choices.length; i++) {
            const roomChoice = this.choices[i];

            const width = canvas.width / this.choices.length;
            const left = i * width;
            const right = left + width;
            const middle = (left + right) / 2;

            ctx.save();
            ctx.translate(middle, (canvas.height) / 2);

            const mouseInside = mousePosition && left < mousePosition.x && mousePosition.x < right;
            if (mouseInside) {
                this.mouseOverChoiceIndex = i;
                ctx.scale(0.75, 0.75);
            } else {
                ctx.scale(0.6, 0.6);
            }

            roomChoice.draw(ctx, canvas);

            ctx.restore();
        }
    }
}

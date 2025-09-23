const FRAME_DURATION = 2;

const MAP_KEY = 'Tab';

const MAP_INSET = 64;
const MAP_BORDER = 4;

export class CaveWorld {
    worldMap: WorldMap;

    constructor() {
        this.worldMap = new WorldMap();

        this.lastFrameTime = performance.now();
        this.unprocessedTime = 0;

        this.pausedFor = undefined;
        this.choosing = true;
        this.choices = [];

        this.tabLatch = latch(false);

        this.mouseOverChoiceIndex = -1;

        this.firstTickInNewRoom = false;
    }

    /** Update loop */
    update(ctx, canvas, mousePosition, keyboardState) {
        this.tabLatch(
            keyboardState[MAP_KEY],
            {
                onLock: () => {
                    if (this.pausedFor === 'Tab') {
                        this.lastFrameTime = performance.now();
                        this.pausedFor = undefined;
                    } else {
                        if (!this.pausedFor) {
                            this.pausedFor = 'Tab';
                        }
                    }
                },
            },
        );

        /** Choices setup */
        if (this.pausedFor === 'choices') {
            if (this.choices.length === 0) {
                this.choices = this.worldMap.generateRoomChoices(this.worldMap.x, this.worldMap.y);
            }

            this.draw(ctx, canvas, mousePosition, 0);
            this.drawMap(ctx, canvas);
            this.drawOptions(ctx, canvas, mousePosition);
            return;
        } else if (this.pausedFor === 'Tab') {
            this.draw(ctx, canvas, mousePosition, 0);

            this.drawMap(ctx, canvas);
            return;
        }

        /** Time computation */
        const currentTime = performance.now();
        const elapsedTime = this.firstTickInNewRoom ? 0 : Math.min(currentTime - this.lastFrameTime, 250);
        this.lastFrameTime = currentTime;

        this.firstTickInNewRoom = false;

        this.unprocessedTime += elapsedTime;

        while (this.unprocessedTime >= FRAME_DURATION && !this.pausedFor) {
            this.simulateFrame(mousePosition, keyboardState);

            this.unprocessedTime -= FRAME_DURATION;
        }

        if (this.pausedFor) {
            this.unprocessedTime = 0;
        }

        const interpolationFactor = this.unprocessedTime / FRAME_DURATION;

        this.draw(ctx, canvas, mousePosition, interpolationFactor);
    }

    drawMap(ctx, canvas) {
        ctx.fillStyle = '#00000099';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.fillRect(MAP_INSET - MAP_BORDER, MAP_INSET - MAP_BORDER, canvas.height - (MAP_INSET - MAP_BORDER) * 2, canvas.height - (MAP_INSET - MAP_BORDER) * 2);

        ctx.fillStyle = 'black';
        ctx.fillRect(MAP_INSET, MAP_INSET, canvas.height - MAP_INSET * 2, canvas.height - MAP_INSET * 2);

        this.worldMap.drawMapToScreen(ctx, MAP_INSET, MAP_INSET, canvas.height - MAP_INSET * 2, canvas.height - MAP_INSET * 2);
    }

    click(_canvas, _mousePosition) {
        const choosing = this.pausedFor === 'choices' && this.choices.length > 0;
        const mousingOverValidOption = this.mouseOverChoiceIndex >= 0 && this.mouseOverChoiceIndex < this.choices.length;

        if (choosing && mousingOverValidOption) {
            const newRoom = this.choices[this.mouseOverChoiceIndex];
            this.worldMap.addRoom(newRoom);

            const lastRoom = this.worldMap.getPreviousRoom();
            this.transferPlayerPosition(lastRoom, newRoom);

            this.unprocessedTime = 0;
            this.firstTickInNewRoom = true;

            this.pausedFor = undefined;
            this.choices = [];
        }
    }

    transferPlayerPosition(lastRoom, newRoom) {
        newRoom.playerState.xVelocity = lastRoom.playerState.xVelocity;
        /** Cap player y velocity when falling room to room */
        newRoom.playerState.yVelocity = Math.min(lastRoom.playerState.yVelocity, 0.1);

        const worldX = lastRoom.playerState.actor.x + lastRoom.x * ROOM_SCALE_WIDTH;
        const worldY = lastRoom.playerState.actor.y + lastRoom.y * ROOM_SCALE_HEIGHT;

        newRoom.playerState.actor.x = worldX - newRoom.x * ROOM_SCALE_WIDTH;
        newRoom.playerState.actor.y = worldY - newRoom.y * ROOM_SCALE_HEIGHT;

        /** If falling room to room cap their new y to 1px down */
        if (newRoom.y >= lastRoom.y + lastRoom.height) {
            newRoom.playerState.actor.y = Math.min(newRoom.playerState.actor.y, 1);
        } else if (newRoom.y + newRoom.height <= lastRoom.y) {
            newRoom.playerState.yVelocity = Math.min(-1.1, newRoom.playerState.yVelocity);
        }

        newRoom.playerState.facing = lastRoom.playerState.facing;
    }

    simulateFrame(mousePosition, keyboardState) {
        const room = this.worldMap.getCurrentRoom();
        room.update(mousePosition, keyboardState, FRAME_DURATION, this.onRoomChange.bind(this));
    }

    onRoomChange(x, y, doors) {
        if (this.worldMap.hasRoom(x, y)) {
            this.worldMap.enterRoom(x, y);

            this.transferPlayerPosition(this.worldMap.getPreviousRoom(), this.worldMap.getCurrentRoom());
        } else {
            this.pausedFor = 'choices';
            this.worldMap.enterRoom(x, y);
            this.choices = this.worldMap.generateRoomChoices(this.worldMap.x, this.worldMap.y, doors);
        }
    }

    draw(ctx, canvas, mousePosition, interpolationFactor) {
        const room = this.worldMap.getCurrentRoom();

        if (room) {
            room.draw(ctx, canvas, mousePosition, interpolationFactor);
        }
    }

    drawOptions(ctx, canvas, mousePosition) {
        this.mouseOverChoiceIndex = -1;

        for (let i = 0; i < this.choices.length; i++) {
            const roomChoice = this.choices[i];

            const left = canvas.height;
            const right = canvas.width;
            const middle = (left + right) / 2;
            const height = canvas.height / this.choices.length;
            const top = height * i;
            const bottom = top + height;

            ctx.save();
            ctx.translate(middle, (top + bottom) / 2);

            const mouseInside = mousePosition && isPointInside({
                x: left,
                y: top,
                width: right - left,
                height,
            }, mousePosition.x, mousePosition.y);

            const scaleFactor = (right - left) / ROOM_SCALE_WIDTH * 0.5;

            ctx.scale(scaleFactor, scaleFactor);

            if (mouseInside) {
                this.mouseOverChoiceIndex = i;
                ctx.scale(1.1, 1.1);
            }

            ctx.translate(-ROOM_SCALE_WIDTH / 2, -ROOM_SCALE_HEIGHT / 2);

            roomChoice.drawForMap(ctx, canvas);

            ctx.restore();
        }
    }
}

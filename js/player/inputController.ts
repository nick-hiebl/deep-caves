export class BufferedThrottledInputController {
    preBufferDuration: number;
    coolDown: number;
    activeDuration: number;

    isPressed: boolean;
    timeSinceUnusedPress: number | undefined;
    isActive: boolean;
    timeSinceActivation: number;

    constructor(preBufferDuration: number, coolDown: number, activeDuration: number) {
        /** Saved config */
        this.preBufferDuration = preBufferDuration;
        this.coolDown = coolDown;
        this.activeDuration = activeDuration;

        /** State variables */
        this.isPressed = false;
        this.timeSinceUnusedPress = undefined;
        this.isActive = false;
        this.timeSinceActivation = Math.max(coolDown, activeDuration);
    }

    update(frameDuration: number, isPressed: boolean | undefined, onActivation: () => void) {
        if (!this.isPressed) {
            if (isPressed) {
                this.timeSinceUnusedPress = 0;
            } else {
                this.timeSinceUnusedPress = undefined;
            }
        } else {
            if (isPressed) {
                this.timeSinceUnusedPress = this.timeSinceUnusedPress === undefined ? undefined : this.timeSinceUnusedPress + frameDuration;
            }
        }

        this.isPressed = !!isPressed;

        if (this.timeSinceActivation < this.activeDuration || this.timeSinceActivation < this.coolDown) {
            this.timeSinceActivation += frameDuration;
        }

        if (this.timeSinceActivation >= this.activeDuration) {
            this.isActive = false;
        }

        const isPressReady = this.timeSinceUnusedPress !== undefined && this.timeSinceUnusedPress < this.preBufferDuration;

        if (!this.isActive && isPressReady && this.timeSinceActivation >= this.coolDown) {
            this.isActive = true;
            this.timeSinceActivation = 0;
            this.timeSinceUnusedPress = undefined;
            onActivation();
        }
    }

    fractionThroughCooldown() {
        if (!this.isActive) {
            return undefined;
        }

        return this.timeSinceActivation / this.activeDuration;
    }
}
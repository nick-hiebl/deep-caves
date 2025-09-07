class BufferedThrottledInputController {
    constructor(preBufferDuration, coolDown, activeDuration) {
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

    update(frameDuration, isPressed, onActivation) {
        if (!this.isPressed) {
            if (isPressed) {
                this.timeSinceUnusedPress = 0;
            } else {
                this.timeSinceUnusedPress = undefined;
            }
        } else {
            if (isPressed) {
                this.timeSinceUnusedPress += frameDuration;
            }
        }

        this.isPressed = isPressed;

        if (this.timeSinceActivation < this.activeDuration || this.timeSinceActivation < this.coolDown) {
            this.timeSinceActivation += frameDuration;
        }

        if (this.timeSinceActivation >= this.activeDuration) {
            this.isActive = false;
        }

        if (!this.isActive && this.timeSinceUnusedPress < this.preBufferDuration && this.timeSinceActivation >= this.coolDown) {
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
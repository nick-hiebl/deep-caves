const latch = (initialState) => {
    let state = initialState ?? false;

    return (newState, { onLock, onRelease }) => {
        if (newState === state) {
            return;
        }

        state = newState;
        if (newState) {
            if (onLock) onLock();
        } else {
            if (onRelease) onRelease();
        }
    };
};

const incDecLatch = (stepsUp, stepsDown) => {
    let state = 0;

    return {
        up(by = 1) {
            state = Math.min(1, state + by / stepsUp);
        },
        down(by = 1) {
            state = Math.max(0, state - by / stepsDown);
        },
        check() {
            return state;
        },
    };
};

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

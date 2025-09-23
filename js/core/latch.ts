export type BooleanLatch = (newState: boolean, handlers: { onLock?: () => void; onRelease?: () => void }) => void;

export const latch = (initialState: boolean): BooleanLatch => {
    let state = initialState;

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

export type IncDecLatch = {
    up: (by?: number) => void;
    down: (by?: number) => void;
    check: () => number;
};

export const incDecLatch = (stepsUp: number, stepsDown: number): IncDecLatch => {
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

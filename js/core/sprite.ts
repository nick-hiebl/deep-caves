export const Sprite = (src: string) => {
    const sprite = new Image();
    sprite.src = src;

    return sprite;
};

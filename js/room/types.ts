export type LDTKFile = {
    levels: Level[];
};

export type Level = {
    identifier: string;
    pxWid: number;
    pxHei: number;
    layerInstances: Layer[];
};

type LayerCommon = {
    __cWid: number;
    __cHei: number;
    __gridSize: number;
};

type IntGridLayer = {
    __identifier: string;
    __type: 'IntGrid';
    intGridCsv: number[];
};

type EntitiesLayer = {
    __identifier: string;
    __type: 'Entities';
    entityInstances: {
        __identifier: string;
        px: [number, number];
        width: number;
        height: number;
    }[];
};

type Layer = LayerCommon & (IntGridLayer | EntitiesLayer);

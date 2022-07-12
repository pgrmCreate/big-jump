export class GameConfig {
    static indexZone = 0;
    static indexLot = 0;

    setup = {
        width: 15,
        height: 14,
        zones : [],
        lots : [],
        roundLeft : 10,
        roundLeftMax : 10,
        tryAmount : 5,
        startPoint : 0,
    }

    constructor() {
        //this.createZone(2, 2, '#FFCC00');

        this.setup.lotWinConfig = {
            isSequential : true,
            randomAmount : 0
        };

        this.setup.lotLooseConfig = {...this.setup.lotWinConfig}

        this.createLot(true, 1, [14, 25], 3, [0, 1, 2]);
        this.createLot(true, 1, [14, 25], 3, [0, 1, 2]);
        this.createLot(false, 1, [14, 25], 3, [0, 1, 2]);
    }

    initRound() {
        this.setup.roundLeft = this.setup.roundLeftMax;
    }

    createZone(x, y, color, targetGroupZone = null) {
        this.setup.zones.push({
            id: GameConfig.indexZone,
            x : x,
            y : y,
            color: color,
            isVisible: true,
            percentWin: 0.5,
            percentLoose: 0.5,
            targetGroupZone : targetGroupZone
        });

        GameConfig.indexZone++;

        return GameConfig.indexZone - 1;
    }

    createLot(isWin, level, earnPoint, maxDraw, applyZones = []) {
        this.setup.lots.push({
            id: GameConfig.indexLot,
            isWin: isWin,
            level : level,
            earnPoint : earnPoint,
            currentDraw : 1,
            maxDraw : maxDraw,
            applyZones : applyZones
        });

        GameConfig.indexLot++;
    }
}

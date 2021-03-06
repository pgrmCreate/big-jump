export class GameConfig {
    static indexZone = 0;
    static indexLot = 0;

    setup = {
        name: '',
        width: 12,
        height: 12,
        zones : [],
        lots : [],
        gainLevelAmount : 3,
        threatLevelAmount : 3,
        roundLeft : 10,
        roundLeftMax : 10,
        tryAmount : 5,
        startPoint : 0,
        finalScore : 24,
        drawTypeGain : 'sequential',
        drawTypeThreat : 'sequential',
        initPositionX: 2,
        initPositionY: 2,
    }

    constructor() {
        this.setup.lotWinConfig = {
            isSequential : true,
            randomAmount : 0
        };

        this.setup.lotLooseConfig = {...this.setup.lotWinConfig}
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

    createLot(isWin, level, earnPointMin,earnPointMax, maxDraw, applyZones = [], isCopyForExploitation = false) {
        const baseLotConfig = {
            id: GameConfig.indexLot,
            isWin: isWin,
            level : level,
            earnPointMin : earnPointMin,
            earnPointMax : earnPointMax,
            currentDraw : 1,
            maxDraw : maxDraw,
            applyZones : []
        };

        const exploitationCopy = {...baseLotConfig};
        exploitationCopy.applyZones = [];

        this.setup.lots.push({ exploration : baseLotConfig, exploitation : exploitationCopy});

        GameConfig.indexLot++;
    }
}

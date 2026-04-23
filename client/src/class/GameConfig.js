export class GameConfig {
    static indexZone = 0;
    static indexLot = 0;
    static idCounter = 0;
    static sizeCellGrid = 35;
    static basePosition = 10;

    static deepCopy(value) {
        return JSON.parse(JSON.stringify(value));
    }

    // Après chargement d'une config existante, on réaligne les compteurs statiques
    // pour éviter de réutiliser des ids déjà présents dans les zones ou lots.
    static syncCounters(setup = {}) {
        const maxZoneId = Array.isArray(setup.zones)
            ? setup.zones.reduce((max, zone) => Math.max(max, zone.id ?? -1), -1)
            : -1;
        const maxLotId = Array.isArray(setup.lots)
            ? setup.lots.reduce((max, lot) => {
                const explorationId = lot?.exploration?.id ?? -1;
                const exploitationId = lot?.exploitation?.id ?? -1;
                return Math.max(max, explorationId, exploitationId);
            }, -1)
            : -1;

        GameConfig.indexZone = Math.max(GameConfig.indexZone, maxZoneId + 1);
        GameConfig.indexLot = Math.max(GameConfig.indexLot, maxLotId + 1);
    }

    // Le payload venant de l'API n'a pas toujours toute la structure attendue côté front :
    // on le fusionne avec les valeurs par défaut pour garder un objet éditable complet.
    static createFromSetup(rawSetup = {}) {
        const gameConfig = new GameConfig();
        const clonedSetup = GameConfig.deepCopy(rawSetup || {});

        gameConfig.setup = {
            ...gameConfig.setup,
            ...clonedSetup,
            participantInfo: Array.isArray(clonedSetup.participantInfo) ? clonedSetup.participantInfo : [],
            textsEvent: Array.isArray(clonedSetup.textsEvent) ? clonedSetup.textsEvent : [],
            zones: Array.isArray(clonedSetup.zones) ? clonedSetup.zones : [],
            lots: Array.isArray(clonedSetup.lots) ? clonedSetup.lots : [],
            gameInterfacePage: {
                ...gameConfig.setup.gameInterfacePage,
                ...(clonedSetup.gameInterfacePage || {})
            },
            lotWinConfig: {
                randomAmount: {
                    exploration: [...(clonedSetup?.lotWinConfig?.randomAmount?.exploration || [])],
                    exploitation: [...(clonedSetup?.lotWinConfig?.randomAmount?.exploitation || [])],
                }
            },
            lotLooseConfig: {
                randomAmount: {
                    exploration: [...(clonedSetup?.lotLooseConfig?.randomAmount?.exploration || [])],
                    exploitation: [...(clonedSetup?.lotLooseConfig?.randomAmount?.exploitation || [])],
                }
            }
        };

        gameConfig._id = gameConfig.setup._id;
        GameConfig.syncCounters(gameConfig.setup);

        return gameConfig;
    }

    // TYPE DRAW
    //      1. SEQUENTIAL
    //      2. RANDOM
    //      3. SEMI-RANDOM

    setup = {
        id: 0,
        name: '',
        width: 12,
        height: 12,
        zones : [],
        lots : [],
        gainLevelAmount : 1,
        threatLevelAmount : 1,
        roundLeft : 10,
        roundLeftMax : 10,
        tryAmount : 5,
        startPoint : 0,
        drawTypeGain : 'sequential',
        drawTypeThreat : 'sequential',
        initPositionX: 2,
        initPositionY: 2,
        participantInfo: [],
        instructionPage: '',
        textsEvent: [],
        gameInterfacePage: {
            score : 'Score du joueur',
            explore : 'Explorer',
            exploite : 'Creuser',
            actionPoints : 'Heures',
        }

    }

    constructor() {
        this.setup.lotWinConfig = {
            randomAmount : {
                exploration : [],
                exploitation : []
            }
        };

        this.id = GameConfig.idCounter;

        GameConfig.idCounter++;

        this.setup.lotLooseConfig = {...this.setup.lotWinConfig, randomAmount: {
            exploration : [],
            exploitation : []
        }}
    }

    initRound() {
        this.setup.roundLeft = this.setup.roundLeftMax;

        this.setup.lots.map(i => {
            i.exploration.currentDraw = 1;
            i.exploitation.currentDraw = 1 ;

            return i;
        });
    }

    createZone(x, y, color, name, targetGroupZone = null) {
        this.setup.zones.push({
            id: GameConfig.indexZone,
            x : x,
            y : y,
            color: color,
            name: name,
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
            currentDraw : 0,
            maxDraw : maxDraw,
            applyZones : []
        };

        const exploitationCopy = {...baseLotConfig};
        exploitationCopy.applyZones = [];

        this.setup.lots.push({ exploration : baseLotConfig, exploitation : exploitationCopy});

        GameConfig.indexLot++;
    }

    deleteLastLotOfType(type = 'gain') {
        const allLotsTyped = this.setup.lots.filter(i => i['exploration'].isWin === (type === 'gain'));
        const lastLotPicked = allLotsTyped[allLotsTyped.length - 1];

        const searchId = this.setup.lots.findIndex(i => (i['exploration'].id === lastLotPicked['exploration'].id));

        this.setup.lots.splice(searchId, 1);

        GameConfig.indexLot--;
    }

    cleanAllLot() {
        this.setup.lots = [];
    }

    clone() {
        return GameConfig.createFromSetup(this.setup);
    }
}

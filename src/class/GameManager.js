import {GameConfig} from "./GameConfig";

export class GameManager {
    static instance = null;

    gameConfig = null;

    player = {
        score : 30,
        position : {
            x : 4,
            y : 4,
        }
    }

    constructor() {
        GameManager.instance = this;
    }

    static get() {
        if(GameManager.instance === null) {
            GameManager.instance = new GameManager();
            GameManager.instance.gameConfig = new GameConfig();
        }

        return GameManager.instance;
    }
}

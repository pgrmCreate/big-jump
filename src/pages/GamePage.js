import React, {useCallback, useContext, useEffect, useState} from "react";

import {Map} from "../components/Map";
import {ConfigContext} from "../utils/ConfigContext";
import {GameManager} from "../class/GameManager";
import {Link} from "react-router-dom";

export function GamePage() {
    const [config, setConfig] = useContext(ConfigContext);
    const [player, setPlayer] = useState(GameManager.get().player);

    const [gameRoundLeft, setGameRoundLeft] = useState(0);

    const handleKeyUp = useCallback((e) => {
        if(gameRoundLeft === 0) {
            return;
        }
        if (e.key === 'ArrowUp') {
            move('up');
        } else if (e.key === 'ArrowLeft') {
            move('left');
        } else if (e.key === 'ArrowRight') {
            move('right');
        } else if (e.key === 'ArrowDown') {
            move('down');
        }
    }, [player, gameRoundLeft])

    useEffect(() => {
        GameManager.get().settingConfig(config.config);

        setGameRoundLeft(GameManager.get().gameConfig.setup.roundLeft);
    }, []);

    useEffect(() => {
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keyup", handleKeyUp);
        }
    }, [handleKeyUp]);

    function handleButtonMove(e) {
        const direction = e.target.tagName === 'I' ? e.target.parentNode.dataset.direction : e.target.dataset.direction;
        move(direction);
    }

    function move(direction) {
        const targetObject = {...player};

        if (direction === 'up') {
            targetObject.position.y -= 1;
        }

        if (direction === 'left') {
            targetObject.position.x -= 1;
        }

        if (direction === 'right') {
            targetObject.position.x += 1;
        }

        if (direction === 'down') {
            targetObject.position.y += 1;
        }

        console.log(targetObject)

        setGameRoundLeft(roundLeft => roundLeft - 1);
        setPlayer(targetObject);
        exploreAction();
    }

    function exploreAction() {
        GameManager.get().gameConfig.setup.zones.forEach((currentZone) => {
            if (currentZone.x === player.position.x && currentZone.y === player.position.y) {
                openZone(currentZone, 'exploration');
            }
        });
    }

    function exploitAction() {
        setGameRoundLeft(roundLeft => roundLeft - 1);

        GameManager.get().gameConfig.setup.zones.forEach((currentZone) => {
            if (currentZone.x === player.position.x && currentZone.y === player.position.y) {
                openZone(currentZone, 'exploitation');
            }
        });
    }

    function openZone(zone, typeAction = 'exploration') {
        const randomDraw = Math.random();
        const setup = GameManager.get().gameConfig.setup;
        let targetWinLot = null;

        if (randomDraw <= zone.percentLoose) {
            targetWinLot = false;
        } else if (randomDraw > zone.percentLoose && randomDraw <= (zone.percentLoose + zone.percentWin)) {
            targetWinLot = true;
        } else {
            return;
        }

        let targetLot = null;

        const listLotAvailable = setup.lots.filter((item) => {
            if (item[typeAction].isWin !== targetWinLot) return false;

            if (item[typeAction].currentDraw > item[typeAction].maxDraw) return false;

            return true;
        }, []);

        if (listLotAvailable.length === 0) {
            console.error('not lot available')
            return;
        }

        targetLot = listLotAvailable[0];
        targetLot[typeAction].currentDraw++;


        let targetPoint = Math.floor(Math.getRandom(targetLot[typeAction].earnPointMin, targetLot[typeAction].earnPointMax));

        if (!targetLot[typeAction].isWin) targetPoint = targetPoint * -1;

        const targetNewPlayer = {...player};
        targetNewPlayer.score += targetPoint;
        setPlayer(targetNewPlayer);
    }

    return (
        <div className="container">
            <div className="row d-flex align-items-center vh-100">
                <div className="col-12 d-flex justify-content-center align-items-center">
                    <h1 className="text-center">Score : {player.score}</h1>

                    <h2 className="text-center mx-5">Heures restantes : {gameRoundLeft}</h2>
                </div>

                {gameRoundLeft > 0 && (
                    <div className="col-12">
                        <div className="d-flex justify-content-center">
                            <Map modeEditor={false} config={config} player={player}/>
                        </div>
                    </div>
                )}

                {gameRoundLeft === 0 && (
                    <div className="col-12">
                        <div className="d-flex justify-content-center">
                            <div className="d-flex flex-column">
                                <p>

                                Bravo ! Vous avez finit avec <b>{player.score}</b> points !
                                </p>

                                <Link to="/" className="btn btn-primary mx-2">
                                    <i className="fa-solid fa-bars mx-2"/>
                                    Menu
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {gameRoundLeft > 0 && (
                    <div className="col-12">
                        <div className="d-flex justify-content-center mb-4">
                            <div>
                                <div className="d-flex justify-content-center">
                                    <button className="btn btn-primary" onClick={handleButtonMove} data-direction="up">
                                        <i className="fa-solid fa-arrow-up"/>
                                    </button>
                                </div>

                                <div className="mx-5 my-3">
                                    <button className="btn btn-primary mx-2" onClick={handleButtonMove}
                                            data-direction="left">
                                        <i className="fa-solid fa-arrow-left"/>
                                    </button>

                                    <button className="btn btn-primary mx-2" onClick={exploitAction}
                                            data-direction="left">
                                        <i className="fa-solid fa-person-digging mx-2"/>
                                        Exploitation
                                    </button>

                                    <button className="btn btn-primary mx-2" onClick={handleButtonMove}
                                            data-direction="right">
                                        <i className="fa-solid fa-arrow-right"/>
                                    </button>
                                </div>

                                <div className="d-flex justify-content-center">
                                    <button className="btn btn-primary" onClick={handleButtonMove}
                                            data-direction="down">
                                        <i className="fa-solid fa-arrow-down"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

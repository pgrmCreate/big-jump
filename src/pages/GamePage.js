import React, {useCallback, useEffect, useState} from "react";

import {Map} from "../components/Map";
import {GameManager} from "../class/GameManager";

export function GamePage() {
    GameManager.get().gameConfig.initRound();
    const [player, setPlayer] = useState({...GameManager.get().player});
    const [gameRoundLeft, setGameRoundLeft] = useState(GameManager.get().gameConfig.setup.roundLeft);

    const handleKeyUp = useCallback((e) => {
        if (e.key === 'ArrowUp') {
            move('up');
        } else if (e.key === 'ArrowLeft') {
            move('left');
        } else if (e.key === 'ArrowRight') {
            move('right');
        } else if (e.key === 'ArrowDown') {
            move('down');
        }
    }, [gameRoundLeft])

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

        if(direction === 'up') {
            targetObject.position.y -= 1;
        }

        if(direction === 'left') {
            targetObject.position.x -= 1;
        }

        if(direction === 'right') {
            targetObject.position.x += 1;
        }

        if(direction === 'down') {
            targetObject.position.y += 1;
        }

        setGameRoundLeft(roundLeft => roundLeft - 1);
        setPlayer(targetObject);
        exploreAction();
    }

    function exploreAction() {
        GameManager.get().gameConfig.setup.zones.forEach((currentZone) => {
            if(currentZone.x === player.position.x && currentZone.y === player.position.y) {
                openZone(currentZone);
            }
        });
    }

    function openZone(zone) {
        const randomDraw = Math.random();
        const setup = GameManager.get().gameConfig.setup;
        let targetWinLot = null;

        if (randomDraw <= zone.percentLoose) {
            targetWinLot = false;
        } else if(randomDraw > zone.percentLoose && randomDraw <= (zone.percentLoose + zone.percentWin)) {
            targetWinLot = true;
        } else {
            return;
        }

        let targetLot = null;

        const listLotAvailable = setup.lots.filter((item) => {
            if(item.isWin !== targetWinLot) return false;

            if(item.currentDraw > item.maxDraw) return false;

            return true;
        }, []);

        if(listLotAvailable.length === 0) {
            return;
        }

        targetLot = listLotAvailable[0];
        targetLot.currentDraw++;
        let targetPoint = Array.isArray(targetLot.earnPoint) ?
            Math.floor(Math.getRandom(targetLot.earnPoint[0], targetLot.earnPoint[1])) :
            targetLot.earnPoint;

        if(!targetLot.isWin) targetPoint = targetPoint * -1;

        const targetNewPlayer = {...player};
        targetNewPlayer.score += targetPoint;
        setPlayer(targetNewPlayer);
    }

    return (
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <h1 className="text-center">Score : { player.score }</h1>

                    <h2 className="text-center">Heures restantes : { gameRoundLeft }</h2>
                </div>

                <div className="col-12">
                    <div className="d-flex justify-content-center">
                        <Map player={player}/>
                    </div>
                </div>

                <div className="col-12">
                    <div className="d-flex justify-content-center">
                        <div>
                            <div className="d-flex justify-content-center">
                                <button className="btn btn-primary" onClick={handleButtonMove} data-direction="up">
                                    <i className="fa-solid fa-arrow-up"/>
                                </button>
                            </div>

                            <div className="mx-5 my-3">
                                <button className="btn btn-primary mx-5" onClick={handleButtonMove} data-direction="left">
                                    <i className="fa-solid fa-arrow-left"/>
                                </button>

                                <button className="btn btn-primary mx-5" onClick={handleButtonMove} data-direction="right">
                                    <i className="fa-solid fa-arrow-right"/>
                                </button>
                            </div>

                            <div className="d-flex justify-content-center">
                                <button className="btn btn-primary" onClick={handleButtonMove} data-direction="down">
                                    <i className="fa-solid fa-arrow-down"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

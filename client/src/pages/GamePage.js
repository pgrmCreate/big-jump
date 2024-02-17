import React, {useCallback, useContext, useEffect, useState} from "react";

import {Map} from "../components/Map";
import {ConfigContext} from "../utils/ConfigContext";
import {GameManager} from "../class/GameManager";
import {Link, useParams} from "react-router-dom";

import './GamePage.css';
import {useCookies} from "react-cookie";
import {Requester} from "../class/Requester";
import {GameConfig} from "../class/GameConfig";

export function GamePage() {
    const [config, setConfig] = useContext(ConfigContext);
    const params = useParams();

    const [player, setPlayer] = useState(GameManager.get().player);
    const [earnPoints, setEarnPoints] = useState([]);
    const [isStart, setIsStart] = useState(false);
    const [isGettingParticipantInfo, setIsGettingParticipantInfo] = useState(true);
    const [historyRows, setHistoryRows] = useState([]);
    const [historySession, setHistorySession] = useState([]);
    const [cookies,, ] = useCookies(['cookie-name']);

    const [gameRoundLeft, setGameRoundLeft] = useState(0);
    const [gameSessionLeft, setGameSessionLeft] = useState(0);
    const [enteringParticipantInfo, setEnteringParticipantInfo] = useState([]);
    const [textsEvent, setTextsEvent] = useState([]);

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
    }, [player, gameRoundLeft]);

    useEffect(() => {
        loadConfig();
    }, []);

    useEffect(() => {
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keyup", handleKeyUp);
        }
    }, [handleKeyUp]);

    useEffect(() => {
        if(gameRoundLeft === 0 && gameSessionLeft !== 0) {
            setHistorySession([...historySession, {
                rows: [...historyRows],
                stats: {
                    score: player.score
                }
            }]);
            setHistoryRows([]);
            setGameSessionLeft(gameSessionLeft - 1);
        } else {

        }
    }, [gameRoundLeft]);

    useEffect(() => {
        if(gameSessionLeft === 0 && isStart) {
            endSession();
        }
    }, [gameSessionLeft]);

    useEffect(() => {
        if(config.config) {
            initGame();
        }
    }, [config])

    function loadConfig() {
        const targetId = params.id;

        Requester.get('/api/gameconfig/' + targetId).then(res => res.json())
            .then((result) => {
                const newGameConfig = new GameConfig();
                newGameConfig.setup = result;
                setConfig({list: config.list, config : newGameConfig});
            }).catch((error) => console.log(error));
    }

    function initGame(newSession = false) {
        config.config.initRound();
        setTextsEvent([]);
        GameManager.get().settingConfig(config.config);
        player.score = config.config.setup.startPoint;

        setGameRoundLeft(GameManager.get().gameConfig.setup.roundLeft);

        if(!newSession) {
            const newEnteringParticipantInfo = [];
            GameManager.get().gameConfig.setup.participantInfo.map((item) => {
                newEnteringParticipantInfo.push({
                    label: item,
                    value: ''
                })
            });

            setEnteringParticipantInfo(newEnteringParticipantInfo);

            setGameSessionLeft(GameManager.get().gameConfig.setup.tryAmount);
        }
    }

    function nextSession() {
        initGame(true);
    }

    function endSession() {
        const targetNewHistory = {
            userId : cookies.user.userId,
            sessions : historySession,
            extraInfo : enteringParticipantInfo
        };

        Requester.post('/api/history', targetNewHistory).then(res => res.json())
            .then((result) => {
                console.log(result);
            }).catch((error) => console.log(error));
    }

    function getIndexEnteringInfo(label) {
        return enteringParticipantInfo.findIndex(item => item.label === label);
    }

    function setValueForEnteringInfo(label, value) {
        const newEnteringInfo = [...enteringParticipantInfo];

        newEnteringInfo[getIndexEnteringInfo(label)].value = value;

        setEnteringParticipantInfo(newEnteringInfo);
    }

    function handleButtonMove(e) {
        const direction = e.target.tagName === 'I' ? e.target.parentNode.dataset.direction : e.target.dataset.direction;
        move(direction);
    }

    function move(direction) {
        const targetObject = {...player};

        if (direction === 'up') {
            if(targetObject.position.y < 2)
                return
            targetObject.position.y -= 1;
        }

        if (direction === 'left') {
            if(targetObject.position.x < 2)
                return
            targetObject.position.x -= 1;
        }

        if (direction === 'right') {
            if(targetObject.position.x + 3 > config.config.setup.width)
                return
            targetObject.position.x += 1;
        }

        if (direction === 'down') {
            if(targetObject.position.y + 3 > config.config.setup.height)
                return
            targetObject.position.y += 1;
        }

        setPlayer(targetObject);
        exploreAction(direction);
        setGameRoundLeft(roundLeft => roundLeft - 1);
    }

    function exploreAction(direction = 'top') {
        let foundZone = false;
        GameManager.get().gameConfig.setup.zones.forEach((currentZone) => {
            if (currentZone.x === player.position.x && currentZone.y === player.position.y) {
                setHistoryRows([...historyRows, openZone(currentZone, 'exploration', direction)]);
                foundZone = true;
            }
        });

        if(!foundZone) {
            setHistoryRows([...historyRows, {
                typeAction : 'exploration',
                positionX : player.position.x,
                positionY : player.position.y,
                direction : direction
            }]);
        }
    }

    function exploitAction() {
        GameManager.get().gameConfig.setup.zones.forEach((currentZone) => {
            if (currentZone.x === player.position.x && currentZone.y === player.position.y) {
                setHistoryRows([...historyRows, openZone(currentZone, 'exploitation')]);
            }
        });

        setGameRoundLeft(roundLeft => roundLeft - 1);
    }

    function openZone(zone, typeAction = 'exploration', direction = null) {
        const randomDraw = Math.random();
        const setup = GameManager.get().gameConfig.setup;
        let targetWinLot = null;
        const targetHistory = {
            typeAction : typeAction,
            positionX : zone.x,
            positionY : zone.y,
            direction : null
        };


        if (randomDraw <= zone.percentLoose) {
            targetWinLot = false;
        } else if (randomDraw > zone.percentLoose && randomDraw <= (zone.percentLoose + zone.percentWin)) {
            targetWinLot = true;
        } else {
            return targetHistory;
        }

        // check type action for get draw type (gain or threat)
        const targetTypeDraw = targetWinLot ? 'drawTypeGain' : 'drawTypeThreat';
        const typeGameDraw = GameManager.get().gameConfig.setup[targetTypeDraw];

        let targetLot = null;
        const listLotAvailable = setup.lots.filter((item) => {
            if (item[typeAction].isWin !== targetWinLot) return false;

            if (item[typeAction].currentDraw > item[typeAction].maxDraw && typeGameDraw === 'sequential') return false;

            if(item[typeAction].applyZones.indexOf(zone.id) === -1) return false

            return true;
        }, []);

        if (listLotAvailable.length === 0) {
            return targetHistory;
        }

        // TYPE DRAW
        //      1. SEQUENTIAL
        //      2. RANDOM
        //      3. SEMI-RANDOM

        if(GameManager.get().gameConfig.setup[targetTypeDraw] === 'sequential') {
            targetLot = listLotAvailable[0];
        } else if(GameManager.get().gameConfig.setup[targetTypeDraw] === 'random') {
            targetLot = listLotAvailable[Math.getRandom(0, listLotAvailable.length - 1)];
        }else if(GameManager.get().gameConfig.setup[targetTypeDraw] === 'semi-random') {

            const randomDraw = Math.floor(Math.random() * 100);
            let currentRowDraw = 0;
            const targetDrawConfig = config.config.setup[targetWinLot ? 'lotWinConfig' : 'lotLooseConfig'].randomAmount[typeAction];

            listLotAvailable.every((lots, index) => {
                currentRowDraw += targetDrawConfig[index];

                if(randomDraw < currentRowDraw) {
                    targetLot = lots;
                    return false;
                }
                return true;
            });
            //targetLot = listLotAvailable[Math.getRandom(0, listLotAvailable.length - 1)];
        } else {
            console.error('error getting lot')
        }



        targetLot[typeAction].currentDraw++;


        let targetPoint = Math.floor(Math.getRandom(targetLot[typeAction].earnPointMin, targetLot[typeAction].earnPointMax));

        if (!targetLot[typeAction].isWin) targetPoint = targetPoint * -1;

        const targetNewPlayer = {...player};
        targetNewPlayer.score += targetPoint;
        addEarn(targetPoint);
        setPlayer(targetNewPlayer);

        targetHistory.amountValue = targetPoint;

        const finalDisplayEvents = [...textsEvent];
        setup.textsEvent
            .filter((currentEvent) => haveTextEvent(currentEvent, targetLot[typeAction].isWin, targetLot[typeAction], zone.targetGroupZone, typeAction))
            .forEach((currentEvent) => {
                finalDisplayEvents.push({
                    id: 0,
                    label : currentEvent.label
                })
            })
        setTextsEvent(finalDisplayEvents);

        return targetHistory;
    }

    function haveTextEvent(event, isWin, targetLot, targetGroupZone, actionType) {
        console.log('event', event);
        console.log('isWin', isWin);
        console.log('targetLot', targetLot);
        console.log('targetGroupZone', targetGroupZone);
        console.log('actionType', actionType);

        if(event.actionType !== 'both') {
            if(actionType !== event.actionType)
                return false;
        }

        if(isWin && event.type === 'threat')
            return false

        if(!isWin && event.type === 'earn')
            return false

        if(targetGroupZone !== parseInt(event.zone))
            return false;

        if(parseInt(event.lot) !== targetLot.id)
            return false

        return true;

    }

    function addEarn(targetPoints) {
        const targetNewId = earnPoints.length === 0 ? 0 : earnPoints[earnPoints.length - 1].id + 1;

        setEarnPoints([...earnPoints, {id: targetNewId, points: targetPoints}]);
    }

    return (
        <div className="container">
            { (!isStart && isGettingParticipantInfo) && (
            <div className="row vh-100 align-items-center">
                <div className="col-4 offset-4">
                    { enteringParticipantInfo.length > 0 && (
                        <form>
                            { config.config.setup.participantInfo.map((label, index) => (
                                <input key={index} className="form-control mb-2" placeholder={label} value={enteringParticipantInfo[getIndexEnteringInfo(label)].value}
                                onChange={(e) => setValueForEnteringInfo(label, e.target.value)}/>
                            ))}
                        </form>
                    )}

                    <button className="btn btn-primary" onClick={() => setIsGettingParticipantInfo(false)}>Next/Instructions</button>
                </div>
            </div>
            )}

            { (!isStart && !isGettingParticipantInfo) && (
            <div className="row vh-100 align-items-center">
                <div className="col-12 ">
                    <p style={{whiteSpace: 'pre-line'}}>
                        { config.config.setup.instructionPage }
                    </p>

                    <button className="btn btn-primary" onClick={() => setIsStart(true)}>Start</button>
                </div>
            </div>
            )}

            { isStart && (
                <div className="row d-flex align-items-center vh-100">
                    <div className="col-12 d-flex justify-content-center align-items-center">
                        <p className="text-center">{ config.config.setup.gameInterfacePage.score} : {player.score}</p>

                        <p className="text-center mx-5">{ config.config.setup.gameInterfacePage.actionPoints} : {gameRoundLeft}</p>

                        <p className="text-center mx-5"> Sessions left : {gameSessionLeft}</p>
                    </div>

                    <div className="points-earn-container">
                        { earnPoints.map((currentEarn, index) => (
                            <div className={'points-earn ' + (currentEarn.points > 0 ? 'earn-plus' : 'earn-minus')} key={index}>
                                { currentEarn.points > 0 ? '+' : ''}
                                { currentEarn.points}
                            </div>
                        ))}
                    </div>

                    {gameRoundLeft > 0 && (
                        <div className="row">
                            <div className="col-3 col-xl-2 game-messages-container">
                                {
                                    textsEvent.reverse().map((messageGame, index) => (
                                        <div key={index}>
                                            <p>{messageGame.label}</p>
                                        </div>
                                    ))
                                }
                            </div>

                            <div className="col-9 col-xl-10">
                                <div className="d-flex justify-content-center">
                                    <Map modeEditor={false} config={config} player={player}/>
                                </div>
                            </div>
                        </div>

                    )}

                    {gameRoundLeft === 0 && (
                        <div className="col-12">
                            <div className="d-flex justify-content-center">
                                <div className="d-flex flex-column">
                                    <p>
                                        <b>{player.score}</b> points !
                                    </p>

                                    <p style={{whiteSpace: 'pre-line'}}>
                                        { config.config.setup.endPage }
                                    </p>

                                    {gameSessionLeft > 0 ? (
                                        <button className="btn btn-primary mx-2" onClick={() => nextSession()}>
                                            <i className="fa-solid fa-circle-right mx-2"/>
                                            Next session
                                        </button>
                                    ) : (
                                        <Link to="/" className="btn btn-primary mx-2">
                                            <i className="fa-solid fa-bars mx-2"/>
                                            End session
                                        </Link>
                                    )}

                                </div>
                            </div>
                        </div>
                    )}

                    {gameRoundLeft > 0 && (
                        <div className="col-9 offset-3 col-xl-10 offset-xl-2">
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
                                            { config.config.setup.gameInterfacePage.exploite}
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

                            <div className="d-flex justify-content-center">
                                <button className="btn btn-danger">Stop</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

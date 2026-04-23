import React, {useCallback, useContext, useEffect, useRef, useState} from "react";

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
    const [, setHistorySession] = useState([]);
    const [cookies,, ] = useCookies(['cookie-name']);

    const [gameRoundLeft, setGameRoundLeft] = useState(0);
    const [gameSessionLeft, setGameSessionLeft] = useState(0);
    const [enteringParticipantInfo, setEnteringParticipantInfo] = useState([]);
    const [textsEvent, setTextsEvent] = useState([]);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [configLoadError, setConfigLoadError] = useState(false);
    const [isSavingHistory, setIsSavingHistory] = useState(false);

    const historyRowsRef = useRef([]);
    const historySessionRef = useRef([]);
    const isStartRef = useRef(false);
    const hasPostedHistoryRef = useRef(false);
    const startedAtRef = useRef(null);

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
    }, [params.id]);

    useEffect(() => {
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keyup", handleKeyUp);
        }
    }, [handleKeyUp]);

    useEffect(() => {
        // Quand un round se termine, on fige les actions courantes dans une session
        // avant d'éventuellement envoyer tout l'historique à la fin de l'expérience.
        if(gameRoundLeft === 0 && historyRows.length > 0) {
            const completedSession = {
                rows: [...historyRows],
                stats: {
                    score: player.score
                }
            };
            const nextHistorySession = [...historySessionRef.current, completedSession];

            historySessionRef.current = nextHistorySession;
            setHistorySession(nextHistorySession);

            historyRowsRef.current = [];
            setHistoryRows([]);
            setGameSessionLeft((currentSessionLeft) => {
                const nextSessionLeft = currentSessionLeft - 1;

                if(nextSessionLeft === 0 && isStartRef.current) {
                    endSession(nextHistorySession);
                }

                return nextSessionLeft;
            });
        }
    }, [gameRoundLeft]);

    useEffect(() => {
        if(config.config) {
            initGame();
        }
    }, [config.config]);

    useEffect(() => {
        isStartRef.current = isStart;
    }, [isStart]);

    function loadConfig() {
        const targetId = params.id;
        setIsLoadingConfig(true);
        setConfigLoadError(false);

        Requester.get('/api/gameconfig/' + targetId).then(res => res.json())
            .then((result) => {
                const newGameConfig = GameConfig.createFromSetup(result);
                setConfig((currentConfig) => ({list: currentConfig.list, config : newGameConfig}));
                setIsLoadingConfig(false);
            }).catch((error) => {
                console.log(error);
                setConfigLoadError(true);
                setIsLoadingConfig(false);
            });
    }

    function initGame(newSession = false) {
        config.config.initRound();
        setTextsEvent([]);
        GameManager.get().settingConfig(config.config);
        setPlayer({
            score: config.config.setup.startPoint,
            position: {
                x: config.config.setup.initPositionX,
                y: config.config.setup.initPositionY
            }
        });
        historyRowsRef.current = [];
        setHistoryRows([]);

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
            historySessionRef.current = [];
            setHistorySession([]);
            hasPostedHistoryRef.current = false;
            startedAtRef.current = null;
        }
    }

    function nextSession() {
        initGame(true);
    }

    function getUserIdFromCookie() {
        if (!cookies.user) return null;
        if (typeof cookies.user === 'string') {
            try {
                return JSON.parse(cookies.user).userId || null;
            } catch (error) {
                return null;
            }
        }
        return cookies.user.userId || null;
    }

    function endSession(sessionsToSave = historySessionRef.current) {
        // La fin de partie peut être déclenchée plusieurs fois très vite
        // via les effets React ; ce verrou évite un double POST d'historique.
        if (hasPostedHistoryRef.current) {
            return;
        }

        hasPostedHistoryRef.current = true;
        setIsSavingHistory(true);

        const targetNewHistory = {
            userId : getUserIdFromCookie(),
            sessions : sessionsToSave,
            infosParticipant : enteringParticipantInfo ?? [],
            configId: config.config.setup._id,
            startedAt: startedAtRef.current,
            spentTime: startedAtRef.current ? (Date.now() - new Date(startedAtRef.current).getTime()) / 1000 : 0
        };

        Requester.post('/api/history', targetNewHistory, true).then(res => res.json())
            .then((result) => {
                setIsSavingHistory(false);
            }).catch((error) => {
                hasPostedHistoryRef.current = false;
                setIsSavingHistory(false);
                console.log(error);
            });
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
        if (!config.config) {
            return;
        }

        const targetObject = {
            ...player,
            position: {...player.position}
        };

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
        userOpenAction(direction, 'exploration', targetObject.position);
        setGameRoundLeft(roundLeft => roundLeft - 1);
    }

    function userOpenAction(direction = 'top', typeAction = "exploration", targetPosition = null) {
        const currentPosition = targetPosition || player.position;
        let foundZone = false;
        GameManager.get().gameConfig.setup.zones.forEach((currentZone) => {
            if (currentZone.x === currentPosition.x && currentZone.y === currentPosition.y) {
                const nextRow = openZone(currentZone, typeAction, direction);
                setHistoryRows((currentRows) => {
                    const nextRows = [...currentRows, nextRow];
                    historyRowsRef.current = nextRows;
                    return nextRows;
                });
                foundZone = true;
            }
        });

        if(!foundZone && typeAction === 'exploration') {
            const nextRow = {
                typeAction : typeAction,
                positionX : currentPosition.x,
                positionY : currentPosition.y,
                direction : direction,
                score: GameManager.get().player.score,
                eventType: 'null',
                actionPointsLeft: gameRoundLeft
            };
            setHistoryRows((currentRows) => {
                const nextRows = [...currentRows, nextRow];
                historyRowsRef.current = nextRows;
                return nextRows;
            });
        }

        if(typeAction === 'exploitation') {
            setGameRoundLeft(roundLeft => roundLeft - 1);
        }
    }

    function openZone(zone, typeAction = 'exploration', direction = null) {
        const randomDraw = Math.random();
        const setup = GameManager.get().gameConfig.setup;
        let targetWinLot = null;
        const targetHistory = {
            typeAction : typeAction,
            positionX : zone.x,
            positionY : zone.y,
            direction : direction,
            score: player.score,
            eventType: 'null',
            actionPointsLeft: gameRoundLeft
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
            // En mode semi-random, on parcourt une distribution cumulée configurée
            // plutôt qu'un tirage uniforme parmi les lots encore disponibles.
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

        const nextScore = player.score + targetPoint;
        addEarn(targetPoint);
        setPlayer((prevPlayer) => ({
            ...prevPlayer,
            score: prevPlayer.score + targetPoint
        }));

        targetHistory.amountValue = targetPoint;
        targetHistory.eventType = targetLot[typeAction].isWin ? 'Gain' : 'Threat';
        targetHistory.score = nextScore;

        const nextDisplayEvents = setup.textsEvent
            .filter((currentEvent) => haveTextEvent(currentEvent, targetLot[typeAction].isWin, targetLot[typeAction], zone.targetGroupZone, typeAction))
            .map((currentEvent) => ({
                id: 0,
                label : currentEvent.label
            }));
        setTextsEvent((currentTextsEvent) => [...currentTextsEvent, ...nextDisplayEvents]);

        return targetHistory;
    }

    function haveTextEvent(event, isWin, targetLot, targetGroupZone, actionType) {
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

        return true;
    }

    function addEarn(targetPoints) {
        setEarnPoints((currentEarnPoints) => {
            const targetNewId = currentEarnPoints.length === 0 ? 0 : currentEarnPoints[currentEarnPoints.length - 1].id + 1;
            return [...currentEarnPoints, {id: targetNewId, points: targetPoints}];
        });
    }

    function handleStopGame() {
        //setGameSessionLeft(gameSessionLeft - 1);
        setGameRoundLeft(0);
    }

    function handleStartGame() {
        if (!startedAtRef.current) {
            const now = new Date().toISOString();
            startedAtRef.current = now;
        }

        setIsStart(true);
    }

    if (isLoadingConfig || !config.config) {
        return (
            <div className="container">
                <div className="row vh-100 align-items-center">
                    <div className="col-12 text-center">
                        {!configLoadError && (
                            <p>Loading experience...</p>
                        )}

                        {configLoadError && (
                            <p className="alert alert-danger">Unable to load this experience.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            { (!isStart && isGettingParticipantInfo) && (
            <div className="row vh-100 align-items-center">
                <div className="col-4 offset-4">
                    { enteringParticipantInfo.length > 0 && (
                        <form>
                            { config.config.setup.participantInfo.map((label, index) => (
                                <div key={index} >
                                    {label === 'Age' && (
                                        <input className="form-control mb-2" placeholder={label}
                                               type="number"
                                               value={enteringParticipantInfo[getIndexEnteringInfo(label)].value}
                                               onChange={(e) => setValueForEnteringInfo(label, e.target.value)}/>
                                    )}

                                    {label === 'Email' && (
                                        <input className="form-control mb-2" placeholder={label}
                                               type="email"
                                               value={enteringParticipantInfo[getIndexEnteringInfo(label)].value}
                                               onChange={(e) => setValueForEnteringInfo(label, e.target.value)}/>
                                    )}

                                    {label === 'Sexe' && (
                                        <select onChange={(e) => setValueForEnteringInfo(label, e.target.value)}
                                                className="form-control my-2"
                                                value={enteringParticipantInfo[getIndexEnteringInfo(label)].value} key={index}>
                                            <option value="male">Female</option>
                                            <option value="female">Male</option>
                                        </select>
                                    )}

                                    {(['Sexe', 'Email', 'Age'].indexOf(label) === -1) && (
                                        <input className="form-control mb-2" placeholder={label}
                                               value={enteringParticipantInfo[getIndexEnteringInfo(label)].value}
                                               onChange={(e) => setValueForEnteringInfo(label, e.target.value)}/>
                                    )}

                                </div>
                            ))}
                        </form>
                    )}

                    <button className="btn btn-primary" onClick={() => setIsGettingParticipantInfo(false)}>Next/Instructions
                    </button>
                </div>
            </div>
            )}

            {(!isStart && !isGettingParticipantInfo) && (
            <div className="row vh-100 align-items-center">
                <div className="col-12 ">
                    <p style={{whiteSpace: 'pre-line'}}>
                        { config.config.setup.instructionPage }
                    </p>

                    <button className="btn btn-primary" onClick={handleStartGame}>Start</button>
                </div>
            </div>
            )}

            { isStart && (
                <div className="row d-flex align-items-center vh-100">
                    <div className="col-12 d-flex justify-content-center align-items-center">
                        <div className="position-relative">
                            <p className="text-center">
                                {config.config.setup.gameInterfacePage.score} : {player.score}
                            </p>
                            <div className="points-earn-container">
                                {earnPoints.map((currentEarn, index) => (
                                    <div
                                        className={'points-earn ' + (currentEarn.points > 0 ? 'earn-plus' : 'earn-minus')}
                                        key={index}>
                                        {currentEarn.points > 0 ? '+' : ''}
                                        {currentEarn.points}
                                    </div>
                                ))}
                            </div>
                        </div>


                        <p className="text-center mx-5">{config.config.setup.gameInterfacePage.actionPoints} : {gameRoundLeft}</p>

                        <p className="text-center mx-5"> Sessions left : {gameSessionLeft}</p>
                    </div>

                    {gameRoundLeft > 0 && (
                        <div className="row">
                            <div className="col-3 col-xl-2 game-messages-container">
                                {
                                    textsEvent.slice().reverse().map((messageGame, index) => (
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
                                        <Link to="/thank-you" className={"btn btn-primary mx-2" + (isSavingHistory ? ' disabled' : '')}>
                                            <i className="fa-solid fa-bars mx-2"/>
                                            {isSavingHistory ? 'Saving...' : 'Finish'}
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
                                        <button className="btn btn-primary" onClick={handleButtonMove}
                                                data-direction="up">
                                            <i className="fa-solid fa-arrow-up"/>
                                        </button>
                                    </div>

                                    <div className="mx-5 my-3">
                                        <button className="btn btn-primary mx-2" onClick={handleButtonMove}
                                                data-direction="left">
                                            <i className="fa-solid fa-arrow-left"/>
                                        </button>

                                        <button className="btn btn-primary mx-2"
                                                onClick={() => userOpenAction(null, 'exploitation')}>
                                            <i className="fa-solid fa-person-digging mx-2"/>
                                            {config.config.setup.gameInterfacePage.exploite}
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

                                <div className="d-flex align-items-end">
                                    <div className="d-flex justify-content-center">
                                        <button className="btn btn-danger" onClick={handleStopGame}>Stop</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

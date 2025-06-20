import {Link, useNavigate, useParams} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {ConfigContext} from "../utils/ConfigContext";

import './ConfigSessionPage.css';
import {Requester} from "../class/Requester";
import {GameConfig} from "../class/GameConfig";
import {ControllerConfigPanel} from "../components/ControllerConfigPanel";
import {AccordionButton} from "../components/AccordionButton";

export default function ConfigSessionPage() {
    const params = useParams();
    const navigate = useNavigate();
    const [globalConfig, setGlobalConfig] = useContext(ConfigContext);
    const [currentConfig, setCurrentConfig] = useState(null);

    const [participantInfoPredifined, setParticipantInfoPredifined] = useState('Identifiant');
    const [gameInterfaceLabel, setGameInterfaceLabel] = useState({
        score: 'Score du joueur',
        explore: 'Explorer',
        exploite: 'Creuser',
        actionPoints: 'Heures',
    });
    const [participantInfo, setParticipantInfo] = useState(['Identifiant', 'Age', 'Sexe', 'Email']);
    const [textsEvent, setTextsEvent] = useState([]);
    const [instructionPage, setInstructionPage] = useState('');
    const [endPage, setEndPage] = useState('');
    const [zoneGroup, setZoneGroup] = useState([]);
    const [menuIsOpen, setMenuIsOpen] = useState([true, true, true, true, true]);

    useEffect(() => {
        loadConfig();
    }, []);

    useEffect(() => {
        if(globalConfig.config) {
            setCurrentConfig(globalConfig.config);
        }
    }, [globalConfig]);

    useEffect(() => {
        if(currentConfig !== null) {
            initConfig();
        }
    }, [currentConfig])

    function createGroupZone() {
        const zoneGroupeBuilder = {};
        const targetNewGroupe = [];

        const newKeyGroupZone = [];
        currentConfig.setup.zones.map((currentZone) => {
            if(newKeyGroupZone.indexOf(currentZone.targetGroupZone) === -1) {
                zoneGroupeBuilder[currentZone.targetGroupZone] = [];
                newKeyGroupZone.push(currentZone.targetGroupZone);
            }

            zoneGroupeBuilder[currentZone.targetGroupZone].push(currentZone.id);
        });

        Object.keys(zoneGroupeBuilder).forEach(k => targetNewGroupe.push(zoneGroupeBuilder[k]))
        setZoneGroup(targetNewGroupe);
    }

    function getZoneFromId(id) {
        return currentConfig.setup.zones.find(i => i.id === id);
    }
    function initConfig() {
        if (params.id) {
            setParticipantInfo(currentConfig.setup.participantInfo);
            setInstructionPage(currentConfig.setup.instructionPage);
            setEndPage(currentConfig.setup.endPage);
            setTextsEvent(currentConfig.setup.textsEvent);
            setGameInterfaceLabel(currentConfig.setup.gameInterfacePage);

            createGroupZone();
        }
    }

    function loadConfig() {
        Requester.get('/api/gameconfig/' + params.id).then((res => res.json()))
            .then((data) => {
                const currentConfigTemp = new GameConfig();
                currentConfigTemp.setup = data;

                setGlobalConfig({list: [], config: currentConfigTemp});
            })
    }

    function addParticipantInfo(targetLabel = 'new info') {
        setParticipantInfo([...participantInfo, targetLabel])
    }

    function deleteParticipantInfo(targetIndex) {
        const targetArray = [...participantInfo];
        targetArray.splice(targetIndex, 1);

        setParticipantInfo(targetArray);
    }

    function editParticipantInfo(e, targetIndex) {
        const targetArray = [...participantInfo];
        targetArray[targetIndex] = e.target.value;

        setParticipantInfo(targetArray);
    }

    function editInterfaceLabel(key, value) {
        setGameInterfaceLabel({...gameInterfaceLabel, [key]: value});
    }

    function addTextEventLabel() {
        setTextsEvent([...textsEvent, {
            type: 'earn',
            zone: 0,
            lot: currentConfig.setup.lots[0].exploration.id,
            label: 'custom label',
            actionType: 'both',
            level : 1
        }])
    }

    function editTextEvent(key, value, index) {
        const targetArray = [...textsEvent];

        targetArray[index][key] = value;

        setTextsEvent(targetArray);
    }

    function saveMap(isWithNavigate = true) {
        currentConfig.setup.participantInfo = participantInfo;
        currentConfig.setup.instructionPage = instructionPage;
        currentConfig.setup.endPage = endPage;
        currentConfig.setup.textsEvent = textsEvent;
        currentConfig.setup.gameInterfacePage = {
            actionPoints: gameInterfaceLabel.actionPoints,
            score: gameInterfaceLabel.score,
            exploite: gameInterfaceLabel.exploite,
            explore: gameInterfaceLabel.explore,
        };

        const targetIndex = globalConfig.list.findIndex(i => i.id === currentConfig.id);
        const targetArray = [...globalConfig.list];

        targetArray[targetIndex] = currentConfig;

        updateConfigServer(isWithNavigate);
    }

    function updateConfigServer(isWithNavigate = true) {
        const dataConfig = {...currentConfig.setup};
        delete dataConfig.roundLeftMax;
        delete dataConfig.id;

        Requester.post(`/api/gameconfig/${dataConfig._id}`, dataConfig).then(res => res.json())
            .then(() => {
                if(isWithNavigate)
                    navigate('/');
            })
            .catch((error) => {
                console.error(error);
            })
    }

    function openMenuAccordion(targetIndex) {
        const cpyMenu = [...menuIsOpen];
        cpyMenu[targetIndex] = !cpyMenu[targetIndex];
        setMenuIsOpen(cpyMenu);
    }

    function getTextsEventLevelChoices(currentEventText, typeLot = 'earn') {
        let filteredLot = currentConfig.setup.lots;
        let configReturned = [];
        function filterByWinState(targetArray) {
            return [...targetArray.filter(i => i['exploration'].isWin === (currentEventText.type === 'earn'))]
        }

        if(!currentConfig.setup.lots)
            return;

        if(currentEventText.type !== 'empty') {
            filteredLot = filterByWinState(filteredLot);
        }

        configReturned = filteredLot.map(i => i['exploration']);

        return configReturned;
    }

    function deleteTextEvent(e) {
        const targetId = parseInt(e.target.dataset.targetId);
        const cpyTextEvents = [...textsEvent];
        cpyTextEvents.splice(targetId, 1);
        setTextsEvent(cpyTextEvents);
    }

    return (
        <div>
            {currentConfig && (
                <div>
                    <div className="page-container">
                        <div className="d-flex justify-content-between align-items-center">
                            <Link to="/" className="btn btn-primary mx-2">
                                <i className="fa-solid fa-bars mx-2"/>
                                Menu
                            </Link>

                            <h1 className="text-center mx-4">
                                Edit config : <b className="success">{currentConfig.setup.name}</b>
                            </h1>
                        </div>

                        <ControllerConfigPanel isEditConfig={!!params.id} configPart={2} configStep={6} currentConfig={currentConfig}
                                                   saveStep={saveMap} saveMap={saveMap}/>
                    </div>

                    <div>
                        <h2 className="text-center my-3">Participant session configuration</h2>
                    </div>

                    <div className={"section-config-container " + (menuIsOpen[0] ? 'is-close' : '')}>
                        <AccordionButton inputValue={menuIsOpen[0]} openMenu={() => openMenuAccordion(0)}/>
                        <div className="section-config">
                            <h3>Participant informations</h3>
                            <p className="fst-italic">information requested from the first page during a session</p>

                            <ul>
                                {participantInfo.map((info, index) => (
                                    <li className="mb-2 d-flex" key={index}>
                                        <input className="form-control" type="text" value={info}
                                               onChange={(e) => editParticipantInfo(e, index)}/>

                                        <button className="btn btn-sm btn-danger mx-2"
                                                onClick={() => {
                                                    deleteParticipantInfo(index)
                                                }}>
                                            <i className="fa fa-trash"></i>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="section-config-aside">
                            <p>Select a predefined field :</p>

                            <div className="d-flex mb-5">
                                <select className="form-select" value={participantInfoPredifined}
                                        onChange={(e) => {
                                            setParticipantInfoPredifined(e.target.value)
                                        }}>
                                    <option value="User">User</option>
                                    <option value="Age">Age</option>
                                    <option value="Sexe">Sexe</option>
                                    <option value="Email">Email</option>
                                </select>

                                <button className="btn btn-sm btn-light mx-2 d-flex align-items-center"
                                        onClick={() => {
                                            addParticipantInfo(participantInfoPredifined)
                                        }}>
                                    <i className="fa fa-plus mx-2"></i>
                                    Add
                                </button>
                            </div>

                            <div>
                                <button className="btn btn-primary" onClick={() => addParticipantInfo()}>
                                    <i className="fa fa-plus mx-2"></i>
                                    Add new input field
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={"section-config-container " + (menuIsOpen[1] ? 'is-close' : '')}>
                        <AccordionButton inputValue={menuIsOpen[1]} openMenu={() => openMenuAccordion(1)}/>
                        <div className="section-config">
                            <h3>Instructions page</h3>
                            <p className="fst-italic">Indicate the instructions to be given to the player before
                                                      playing
                            </p>

                            <textarea className="form-control" cols="30" rows="10" value={instructionPage}
                                      onChange={(e) => setInstructionPage(e.target.value)}></textarea>
                        </div>

                        <div className="section-config-aside"></div>
                    </div>

                    <div className={"section-config-container " + (menuIsOpen[2] ? 'is-close' : '')}>
                        <AccordionButton inputValue={menuIsOpen[2]} openMenu={() => openMenuAccordion(2)}/>
                        <div className="section-config">
                            <h3>Game Interface Page</h3>
                            <p className="fst-italic">changes to player interface labels</p>

                            <div className="label-definition">
                                <label className="d-flex">
                                    <span className="label">Action points :</span>
                                    <input type="text" className="form-control" value={gameInterfaceLabel.actionPoints}
                                           onChange={(e) => {
                                               editInterfaceLabel('actionPoints', e.target.value)
                                           }}/>
                                </label>

                                <label className="d-flex">
                                    <span className="label">Score :</span>
                                    <input type="text" className="form-control" value={gameInterfaceLabel.score}
                                           onChange={(e) => {
                                               editInterfaceLabel('score', e.target.value)
                                           }}/>
                                </label>

                                <label className="d-flex">
                                    <span className="label">Exploration :</span>
                                    <input type="text" className="form-control" value={gameInterfaceLabel.explore}
                                           onChange={(e) => {
                                               editInterfaceLabel('explore', e.target.value)
                                           }}/>
                                </label>

                                <label className="d-flex">
                                    <span className="label">Exploitation :</span>
                                    <input type="text" className="form-control" value={gameInterfaceLabel.exploite}
                                           onChange={(e) => {
                                               editInterfaceLabel('exploite', e.target.value)
                                           }}/>
                                </label>
                            </div>
                        </div>

                        <div className="section-config-aside">
                            <div className="d-flex mb-5">

                            </div>
                        </div>
                    </div>

                    <div className={"section-config-container " + (menuIsOpen[3] ? 'is-close' : '')}>
                        <AccordionButton inputValue={menuIsOpen[3]} openMenu={() => openMenuAccordion(3)}/>
                        <div className="section-config">
                            <h3>Text event</h3>
                            <p className="fst-italic">proposal of text to display by type of event</p>
                            {textsEvent.map((currentEvent, currentIndex) => (
                                <div className="d-flex mb-3" key={currentIndex}>
                                    <select className="form-select mx-2" value={currentEvent.zone}
                                            onChange={(e) => {
                                                editTextEvent('zone', e.target.value, currentIndex)
                                            }}>
                                        {zoneGroup.map((currentZone, indexZone) => (
                                            <option value={indexZone} key={indexZone}>
                                                {getZoneFromId(currentZone[0]).name}
                                            </option>
                                        ))}
                                    </select>

                                    <select className="form-select mx-2" value={currentEvent.type}
                                            onChange={(e) => {
                                                editTextEvent('type', e.target.value, currentIndex)
                                            }}>
                                        <option value="earn">Earn</option>
                                        <option value="threat">Threat</option>
                                        <option value="empty">Empty</option>
                                    </select>

                                    <select className="form-select mx-2" value={currentEvent.level} onChange={(e) => {
                                        editTextEvent('level', e.target.value, currentIndex)
                                    }}>
                                        {getTextsEventLevelChoices(currentEvent, currentEvent.type)
                                            .map((currentLot, currentIndexLot) => (
                                            <option value={currentLot.level}
                                                key={currentIndexLot}>
                                                {/*{currentEvent.type === 'earn' && (<> Gain </>)}
                                                {currentEvent.type === 'threat' && (<> Threat </>)*/}
                                                level {currentLot.level}
                                            </option>
                                        ))}
                                        {currentEvent.type === 'empty' && (<option value="null">Any level (empty)</option>)}
                                    </select>

                                    {<select className="form-select mx-2" value={currentEvent.actionType}
                                             onChange={(e) => {
                                                 editTextEvent('actionType', e.target.value, currentIndex)
                                             }}>
                                        {['exploration', 'exploitation', 'both'].map((currentAction) => (
                                            <option value={currentAction} key={currentAction}>
                                                {currentAction}
                                            </option>
                                        ))}
                                    </select>}

                                    <input className="form-control mx-2 text-event-input" type="text"
                                           placeholder="custom text" value={currentEvent.label} onChange={(e) => {
                                        editTextEvent('label', e.target.value, currentIndex)
                                    }}/>

                                    <div className="d-flex align-items-center">
                                        <i className="fa fa-trash trash-hover" onClick={deleteTextEvent} data-target-id={currentIndex}/>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="section-config-aside">
                            <button className="btn btn-primary mb-3" onClick={() => addTextEventLabel()}>
                                <i className="fa fa-plus mx-2"></i>
                                Add custom label
                            </button>

                            <div className="d-flex align-items-center">
                                <i className="fa fa-square"></i>

                                <p className="mb-0 mx-2">Default: show nothing</p>
                            </div>

                            <div className="d-flex align-items-center">
                                <i className="fa fa-square"></i>

                                <p className="mb-0 mx-2">Default: Show only earned points</p>
                            </div>
                        </div>
                    </div>

                    <div className={"section-config-container " + (menuIsOpen[4] ? 'is-close' : '')}>
                        <AccordionButton inputValue={menuIsOpen[4]} openMenu={() => openMenuAccordion(4)}/>
                        <div className="section-config">
                            <h3>End page</h3>
                            <p className="fst-italic">Message or link sent to the player at the end of the game</p>

                            <textarea className="form-control" cols="30" rows="10" value={endPage}
                                      onChange={(e) => setEndPage(e.target.value)}></textarea>
                        </div>

                        <div className="section-config-aside"></div>
                    </div>

                    <button className="btn btn-lg btn-primary save-button" onClick={() => saveMap()}>
                        <i className="fa fa-save mx-2" onClick={() => saveMap()}></i>
                        Save map
                    </button>
                </div>
            )}
        </div>
    );
}

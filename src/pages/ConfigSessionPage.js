import {Link, useParams} from "react-router-dom";
import {useContext, useState} from "react";
import {ConfigContext} from "../utils/ConfigContext";

import './ConfigSessionPage.css';

export default function ConfigSessionPage() {
    const params = useParams();
    const [globalConfig, setGlobalConfig] = useContext(ConfigContext);
    const currentConfig = globalConfig.list.find(i => i.id === parseInt(params.id));

    const [participantInfoPredifined, setParticipantInfoPredifined] = useState('Identifiant');
    const [gameInterfaceLabel, setGameInterfaceLabel] = useState({
        score : 'Score du joueur',
        explore : 'Explorer',
        exploite : 'Creuser',
        actionPoints : 'Heures',
    });
    const [participantInfo, setParticipantInfo] = useState(['Identifiant', 'Age', 'Sexe', 'Email']);

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

    }

    return (
        <div>
            <div className="page-container">
                <div className="d-flex justify-content-between align-items-center">
                    <Link to="/" className="btn btn-primary mx-2">
                        <i className="fa-solid fa-bars mx-2"/>
                        Menu
                    </Link>

                    <h1 className="text-center mx-4">
                        Edit config : <b className="success">{ currentConfig.setup.name }</b>
                    </h1>
                </div>
            </div>

            <div>
                <h2 className="text-center my-3">Participant session configuration</h2>
            </div>

            <div className="section-config-container">
                <div className="section-config">
                    <h3>Participant informations</h3>
                    <p className="fst-italic">information requested from the first page during a session</p>

                    <ul>
                        { participantInfo.map((info, index) => (
                            <li className="mb-2 d-flex">
                                <input className="form-control" type="text" value={info}
                                    onChange={(e) => editParticipantInfo(e, index)}/>

                                <button className="btn btn-sm btn-danger mx-2"
                                        onClick={() => {deleteParticipantInfo(index)}}>
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
                        onChange={(e) => {setParticipantInfoPredifined(e.target.value)}}>
                            <option value="Identifiant">Identifiant</option>
                            <option value="Age">Age</option>
                            <option value="Sexe">Sexe</option>
                            <option value="Email">Email</option>
                        </select>

                        <button className="btn btn-sm btn-light mx-2 d-flex align-items-center"
                        onClick={() => {addParticipantInfo(participantInfoPredifined)}}>
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

            <div className="section-config-container">
                <div className="section-config">
                    <h3>Instructions page</h3>
                    <p className="fst-italic">Indicate the instructions to be given to the player before playing</p>

                    <textarea className="form-control" cols="30" rows="10"></textarea>
                </div>

                <div className="section-config-aside"></div>
            </div>

            <div className="section-config-container">
                <div className="section-config">
                    <h3>Game Interface Page</h3>
                    <p className="fst-italic">modifications des labels de l'interface joueur</p>

                    <div className="label-definition">
                        <label className="d-flex">
                            <span className="label">Points d'actions :</span>
                            <input type="text" className="form-control" value={gameInterfaceLabel.actionPoints}
                            onChange={(e) => { editInterfaceLabel('actionPoints', e.target.value)}}/>
                        </label>

                        <label className="d-flex">
                            <span className="label">Score :</span>
                            <input type="text" className="form-control" value={gameInterfaceLabel.score}
                                   onChange={(e) => { editInterfaceLabel('score', e.target.value)}}/>
                        </label>

                        <label className="d-flex">
                            <span className="label">Explore :</span>
                            <input type="text" className="form-control" value={gameInterfaceLabel.explore}
                                   onChange={(e) => { editInterfaceLabel('explore', e.target.value)}}/>
                        </label>

                        <label className="d-flex">
                            <span className="label">Exploite :</span>
                            <input type="text" className="form-control" value={gameInterfaceLabel.exploite}
                                   onChange={(e) => { editInterfaceLabel('exploite', e.target.value)}}/>
                        </label>
                    </div>
                </div>

                <div className="section-config-aside">
                    <div className="d-flex mb-5">

                    </div>
                </div>
            </div>

            <div className="section-config-container">
                <div className="section-config">
                    <h3>Text event</h3>
                    <p className="fst-italic">proposal of text to display by type of event</p>

                    <div className="d-flex">
                        <select className="form-select mx-2">
                            <option value="earn">Earn</option>
                            <option value="threat">Threat</option>
                            <option value="empty">Empty</option>
                        </select>

                        <select className="form-select mx-2">
                            { currentConfig.setup.zones.map((currentZone) => (
                                <option value={currentZone.id}>Zone { currentZone.id }</option>
                            ))}
                        </select>

                        <select className="form-select mx-2">
                            { currentConfig.setup.lots.map((currentLot) => (
                                <option value={currentLot.exploration.id}>Category { currentLot.exploration.id }</option>
                            ))}
                        </select>

                        <input className="form-control mx-2 text-event-input" type="text" placeholder="custom text"/>
                    </div>
                </div>

                <div className="section-config-aside">
                    <button className="btn btn-primary mb-3">
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

            <div className="section-config-container">
                <div className="section-config">
                    <h3>End page</h3>
                    <p className="fst-italic">Message or link sent to the player at the end of the game</p>

                    <textarea className="form-control" cols="30" rows="10"></textarea>
                </div>

                <div className="section-config-aside"></div>
            </div>
        </div>
    );
}

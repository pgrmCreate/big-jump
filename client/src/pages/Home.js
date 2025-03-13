import './Home.css';
import Modal from 'react-modal';
import {useContext, useEffect, useState} from "react";
import {ConfigContext} from "../utils/ConfigContext";
import {Link, useNavigate} from "react-router-dom";
import User from "../components/User";
import {UserContext} from "../utils/UserContext";
import {Requester} from "../class/Requester";
import {GameConfig} from "../class/GameConfig";
import {CSVCreator} from "../class/CSVCreator";

export default function Home() {
    const [globalConfig, setGlobalConfig] = useContext(ConfigContext);
    const [userContext, setUserContext] = useContext(UserContext);
    const [targetXpLink, setTargetXpLink] = useState(false);
    const [isMenuExportOpen, setIsMenuExportOpen] = useState(false);
    const [historyGames, setHistoryGames] = useState([]);
    const [exportDataConfig, setExportDataConfig] = useState({
        position: true,
        typeAction: true,
        eventType: true,
        pointsEvent: true,
        score: true,
        actionPoints: true,
        spentTotalTime: true,
        infosParticipant: true,
        targetConfig: null,
    });
    const navigate = useNavigate();

    const customStylesModal = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            width: '800px',
            height: '410px',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
        },
    };

    useEffect(() => {
        if (userContext !== null) {
            loadConfigs();
        } else {
            setGlobalConfig({list: [], config: null});
        }
    }, [userContext]);

    function loadConfigs() {
        Requester.get('/api/gameconfig').then((res => res.json()))
            .then((data) => {
                const listConfig = [];

                data.map((i) => {
                    const newGameConfig = new GameConfig();
                    const newObject = {
                        ...newGameConfig.setup,
                        ...i
                    }

                    newGameConfig.setup = newObject;
                    newGameConfig._id = newObject._id;
                    listConfig.push(newGameConfig);
                })

                setGlobalConfig({list: listConfig, config: null});
            });

        Requester.get('/api/history')
            .then((res => res.json()))
            .then((data) => {
                setHistoryGames(data);
            });
    }

    function pickExperience(targetXp) {
        targetXp.initRound();
        setGlobalConfig({list: globalConfig.list, config: targetXp});
        navigate('/game/' + targetXp.setup._id);
    }

    function editExperience(idExperience) {
        setGlobalConfig({list: globalConfig.list, config: globalConfig.list.find(i => i.setup._id === idExperience)});
        navigate('/edit-config/' + idExperience);
    }

    function handleRemoveExperience(targetSetup) {
        targetSetup.loading = true;
        setGlobalConfig({
            list: globalConfig.list, config: globalConfig.list.find(i => i.setup._id === targetSetup._id)
        });

        Requester.delete(`/api/gameconfig/${targetSetup._id}`)
            .then(res => res.json())
            .then(() => {
                loadConfigs();
            }).catch((error) => console.error({error}))
    }

    function handleClearHistory(targetSetup, isDisabled) {
        if (isDisabled === 'true')
            return;

        targetSetup.loading = true;
        setGlobalConfig({
            list: globalConfig.list, config: globalConfig.list.find(i => i.setup._id === targetSetup._id)
        });

        Requester.delete(`/api/history/gameconfig/${targetSetup._id}`)
            .then(res => res.json())
            .then(() => {
                targetSetup.loading = false;
                loadConfigs();
            }).catch((error) => console.error({error}))
    }

    function displayDate(date) {
        const dateOut = new Date(date);

        return `${dateOut.getDay()}/${dateOut.getMonth()}/${dateOut.getFullYear()}`;
    }

    function handleGetLink(xp) {
        setTargetXpLink(xp);
    }

    function exportDataHistoryToCSV() {
        let item = exportDataConfig.targetConfig;

        Requester.get('/api/history')
            .then(res => res.json())
            .then((data) => {
                const targetHistory = [...data].filter(currentHistory => {
                    return currentHistory.configId === item._id;
                });

                const csvCreator = new CSVCreator(targetHistory, exportDataConfig);

                // Créer un Blob avec le contenu CSV
                const blob = new Blob([csvCreator.generateCSV()], {type: 'text/csv;charset=utf-8;'});
                const href = URL.createObjectURL(blob);

                // Créer un lien pour le téléchargement
                const link = document.createElement('a');
                link.href = href;
                link.download = "export.csv"; // Nom du fichier CSV
                document.body.appendChild(link);
                link.click();

                // Nettoyage en supprimant le lien du DOM
                document.body.removeChild(link);
            });
    }

    function handleActiveExportDataMenu(targetConfig) {
        if(haveNotHistoryInConfig(targetConfig))
            return false;

        setIsMenuExportOpen(true);
        setExportDataConfig({...exportDataConfig, targetConfig: targetConfig})
    }

    function handleChangeExportData(e) {
        setExportDataConfig({
            ...exportDataConfig,
            [e.target.dataset.key]: !exportDataConfig[e.target.dataset.key],
        })
    }

    function haveNotHistoryInConfig(targetConfig) {
        return (historyGames.filter(i => i.configId === targetConfig._id).length === 0)
    }

    return (<div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <h1 className="text-center my-5">BiG JuMp !</h1>
                </div>

                {userContext === null && (
                    <div>
                        <p className="alert alert-warning">
                            You need to be authentificated for manage experiences </p>
                    </div>
                )}

                {userContext !== null && (
                    <div className="col-12 d-flex justify-content-center flex-column align-items-center">
                        <Link className="btn btn-primary my-3" to="/config">
                            <i className="fa-solid fa-plus mx-2"/>
                            New experience
                        </Link>

                        <div>
                            <h2>Experiences</h2>
                            <hr/>
                        </div>

                        <div className="experiences-container">
                            {globalConfig.list.map((item, index) => (
                                <div className="experience-card" key={index}>
                                    {(item.setup.loading) && (
                                        <div className="d-flex w-100 justify-content-center">
                                            <span className="loader"></span>
                                        </div>
                                    )}

                                    {!item.setup.loading && (
                                        <>
                                            <div className="experience-head">
                                                <p className="experience-title">
                                                    {item.setup.name}
                                                </p>

                                                <p className="experience-date">
                                                    {displayDate(item.setup.createdAt)}
                                                </p>
                                            </div>

                                            <div className="d-flex flex-column">
                                                <div className="d-flex mb-3">
                                                    <button className="btn btn-success"
                                                            onClick={() => handleGetLink(item)}>
                                                        <i className="fa-regular fa-circle-right mx-2"></i>
                                                        Get link
                                                    </button>


                                                    <button className="btn btn-primary mx-2"
                                                            onClick={() => editExperience(item.setup._id)}>
                                                        <i className="fa-solid fa-pen mx-2"/>
                                                        Edit
                                                    </button>

                                                    <button className="btn btn-primary" data-disabled={haveNotHistoryInConfig(item)}
                                                            onClick={() => handleActiveExportDataMenu(item)}>
                                                        <i className="fa-solid fa-file-export mx-2"/>
                                                        Export data
                                                    </button>
                                                </div>

                                                <div
                                                    className="experience-extra-actions justify-content-end w-100 d-flex">
                                                    <button className="btn btn-sm btn-primary mx-2"
                                                            onClick={() => pickExperience(item)}>
                                                        <i className="fa-solid fa-play mx-2"/>
                                                        Run test
                                                    </button>

                                                    <button className={"btn btn-sm btn-warning me-2"}
                                                            data-disabled={haveNotHistoryInConfig(item)}
                                                            onClick={(e) => handleClearHistory(item.setup, e.target.dataset.disabled)}>
                                                        <i className="fa-solid fa-trash mx-2"/>
                                                        Clear story
                                                    </button>

                                                    <button className="btn btn-sm btn-danger"
                                                            onClick={() => handleRemoveExperience(item.setup)}>
                                                        <i className="fa-solid fa-trash mx-2"/>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {globalConfig.list.length === 0 && (
                            <p className="alert alert-warning my-2">
                                No experience for moment </p>
                        )}
                    </div>
                )}
            </div>

            <User/>

            <div className="row">
                <Modal style={customStylesModal} isOpen={targetXpLink ? true : false} contentLabel="Menu open">

                    <div className="d-flex flex-column h-100">
                        <div className="d-flex flex-1 flex-column">
                            <p>
                                Use this link for start a new experience to candidats </p>

                            {targetXpLink && (
                                <p className="link-target-xp">
                                    {window.location.origin}/game/{targetXpLink.setup._id}
                                </p>
                            )}
                        </div>

                        <button className="btn btn-success" onClick={() => setTargetXpLink(false)}>
                            <i className="fa-regular fa-circle-xmark mx-2"/>
                            Close
                        </button>
                    </div>
                </Modal>

                <Modal style={customStylesModal} isOpen={isMenuExportOpen} contentLabel="Export data history">
                    <div className="d-flex flex-column h-100">
                        <h2 className="text-center mb-4">Export data config</h2>

                        <div className="export-data-container">
                            <div className="export-data-row">
                                Position
                                <i className={"fa-solid fa-square" + (exportDataConfig.position ? '-check' : '')}
                                   data-key="position" onClick={handleChangeExportData}/>
                            </div>

                            <div className="export-data-row">
                                Action type
                                <i className={"fa-solid fa-square" + (exportDataConfig.typeAction ? '-check' : '')}
                                   data-key="typeAction" onClick={handleChangeExportData}/>
                            </div>

                            <div className="export-data-row">
                                Event type (threat, Gain or empty)
                                <i className={"fa-solid fa-square" + (exportDataConfig.eventType ? '-check' : '')}
                                   data-key="eventType" onClick={handleChangeExportData}/>
                            </div>

                            <div className="export-data-row">
                                Points earn or lost
                                <i className={"fa-solid fa-square" + (exportDataConfig.pointsEvent ? '-check' : '')}
                                   data-key="pointsEvent" onClick={handleChangeExportData}/>
                            </div>

                            <div className="export-data-row">
                                Score
                                <i className={"fa-solid fa-square" + (exportDataConfig.score ? '-check' : '')}
                                   data-key="score" onClick={handleChangeExportData}/>
                            </div>

                            <div className="export-data-row">
                                Actions points remaining
                                <i className={"fa-solid fa-square" + (exportDataConfig.actionPoints ? '-check' : '')}
                                   data-key="actionPoints" onClick={handleChangeExportData}/>
                            </div>

                            <div className="export-data-row">
                                Total spent time
                                <i className={"fa-solid fa-square" + (exportDataConfig.spentTotalTime ? '-check' : '')}
                                   data-key="spentTotalTime" onClick={handleChangeExportData}/>
                            </div>

                            <div className="export-data-row">
                                Infos participant
                                <i className={"fa-solid fa-square" + (exportDataConfig.infosParticipant ? '-check' : '')}
                                   data-key="infosParticipant" onClick={handleChangeExportData}/>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end">
                            <button className="btn btn-success mx-3" onClick={exportDataHistoryToCSV}>
                                <i className="fa-solid fa-download mx-2"/>
                                 Download history / Export data
                            </button>

                            <button className="btn btn-primary" onClick={() => setIsMenuExportOpen(false)}>
                                <i className="fa-regular fa-circle-xmark mx-2"/>
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    )
}

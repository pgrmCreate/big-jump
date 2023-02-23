import './Home.css';
import Modal from 'react-modal';
import {useContext, useEffect, useState} from "react";
import {ConfigContext} from "../utils/ConfigContext";
import {Link, useNavigate} from "react-router-dom";
import User from "../components/User";
import {UserContext} from "../utils/UserContext";
import {Requester} from "../class/Requester";
import {GameConfig} from "../class/GameConfig";

export default function Home() {
    const [globalConfig, setGlobalConfig] = useContext(ConfigContext);
    const [userContext, setUserContext] = useContext(UserContext);
    const [targetXpLink, setTargetXpLink] = useState(false);
    const navigate = useNavigate();

    const customStylesModal = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            width: '800px',
            height: '400px',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
        },
    };

    useEffect(() => {
        if(userContext !== null) {
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
            })
    }

    function pickExperience(targetXp) {
        targetXp.initRound();
        setGlobalConfig({list : globalConfig.list, config : targetXp});
        navigate('/game/' + targetXp.setup._id);
    }

    function editExperience(idExperience) {
        setGlobalConfig({list : globalConfig.list, config : globalConfig.list.find(i => i.setup._id === idExperience)});
        navigate('/edit-config/' + idExperience);
    }

    function handleRemoveExperience(targetId) {
        Requester.delete(`/api/gameconfig/${targetId}`).then(res => res.json())
            .then(() => {
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

    function exportData(data) {
        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = data.setup.name.split(' ')[0] + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (<div className="container">
        <div className="row">
            <div className="col-12">
                <h1 className="text-center my-5">BiG JuMp !</h1>
            </div>

            { userContext === null && (
                <div>
                    <p className="alert alert-warning">
                        You need to be authentificated for manage experiences
                    </p>
                </div>
            ) }

            { userContext !== null && (
                <div className="col-12 d-flex justify-content-center flex-column align-items-center">
                    <Link className="btn btn-primary my-3" to="/config">
                        <i className="fa-solid fa-plus mx-2"/>
                        New experience
                    </Link>

                    <div>
                        <h2>Experiences</h2> <hr/>
                    </div>

                    <div className="experiences-container">
                        { globalConfig.list.map((item, index) => (
                            <div className="experience-card" key={index}>
                                <div className="experience-head">
                                    <p className="experience-title">
                                        { item.setup.name}
                                    </p>

                                    <p className="experience-date">
                                        {displayDate(item.setup.createdAt)}
                                    </p>
                                </div>

                                <div className="d-flex flex-column">
                                    <div className="d-flex mb-3">
                                        <button className="btn btn-success" onClick={() => handleGetLink(item)}>
                                            <i className="fa-regular fa-circle-right mx-2"></i>
                                            Get link
                                        </button>


                                        <button className="btn btn-primary mx-2" onClick={() => editExperience(item.setup._id)}>
                                            <i className="fa-solid fa-pen mx-2"/>
                                            Edit
                                        </button>

                                        <button className="btn btn-primary" onClick={() => exportData(item)}>
                                            <i className="fa-solid fa-file-export mx-2"/>
                                            Export data
                                        </button>
                                    </div>

                                    <div className="experience-extra-actions justify-content-end w-100 d-flex">
                                        <button className="btn btn-sm btn-primary mx-2" onClick={() => pickExperience(item)}>
                                            <i className="fa-solid fa-play mx-2"/>
                                            Run test
                                        </button>

                                        <button className="btn btn-sm btn-danger" onClick={() => handleRemoveExperience(item.setup._id)}>
                                            <i className="fa-solid fa-trash mx-2"/>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    { globalConfig.list.length === 0 && (
                        <p className="alert alert-warning my-2">
                            No experience for moment
                        </p>
                    )}
                </div>
            )}
        </div>

        <User/>

        <div className="row">
            <Modal
                style={customStylesModal}
                isOpen={targetXpLink ? true : false}
                contentLabel="Minimal Modal Example">

                <div className="d-flex flex-column h-100">
                    <div className="d-flex flex-1 flex-column">
                        <p>
                            Use this link for start a new experience to candidats
                        </p>

                        { targetXpLink && (
                            <p className="link-target-xp">
                                {window.location.origin}/game/{ targetXpLink.setup._id }
                            </p>
                        ) }
                    </div>

                    <button className="btn btn-success" onClick={() => setTargetXpLink(false)}>
                        <i className="fa-regular fa-circle-xmark mx-2"/>
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    </div>)
}

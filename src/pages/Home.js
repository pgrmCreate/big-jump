import './Home.css';
import {useContext} from "react";
import {ConfigContext} from "../utils/ConfigContext";
import {Link, useNavigate} from "react-router-dom";

export default function Home() {
    const [globalConfig, setGlobalConfig] = useContext(ConfigContext);
    const navigate = useNavigate();

    function pickExperience(targetXp) {
        targetXp.initRound();
        setGlobalConfig({list : globalConfig.list, config : targetXp});
        navigate('/game');
    }

    function editExperience(idExperience) {
        setGlobalConfig({list : globalConfig.list, config : globalConfig.list.find(i => i === idExperience)});
        navigate('/edit-config/' + idExperience);
    }

    function handleRemoveExperience(targetId) {
        const newListConfig = [...globalConfig.list];
        newListConfig.splice(targetId, 1);

        setGlobalConfig({list: newListConfig, config: globalConfig.config})
    }

    return (<div className="container">
        <div className="row">
            <div className="col-12">
                <h1 className="text-center my-5">BiG JuMp !</h1>
            </div>

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
                            <p>
                                { item.setup.name}
                            </p>

                            <div className="d-flex">
                                <button className="btn btn-success" onClick={() => pickExperience(item)}>
                                    <i className="fa-solid fa-play mx-2"/>
                                    Play
                                </button>

                                <button className="btn btn-primary mx-2" onClick={() => editExperience(item.id)}>
                                    <i className="fa-solid fa-pen mx-2"/>
                                    Edit
                                </button>

                                <button className="btn btn-danger" onClick={() => handleRemoveExperience(index)}>
                                    <i className="fa-solid fa-trash mx-2"/>
                                    Delete
                                </button>
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
        </div>
    </div>)
}

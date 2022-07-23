import './Home.css';
import {useContext} from "react";
import {ConfigContext} from "../utils/ConfigContext";
import {Link, useNavigate} from "react-router-dom";

export default function Home() {
    const [globalConfig, setGlobalConfig] = useContext(ConfigContext);
    const navigate = useNavigate();

    function pickExperience(targetXp) {
        setGlobalConfig({list : globalConfig.list, config : targetXp});
        navigate('/game');
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
                    { globalConfig.list.map((item) => (
                        <div className="experience-card">
                            <p>
                                { item.setup.name}
                            </p>

                            <div className="d-flex">
                                <button className="btn btn-success" onClick={() => pickExperience(item)}>
                                    <i className="fa-solid fa-play mx-2"/>
                                    Play
                                </button>

                                <button className="btn btn-danger mx-3"  title="No available">
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

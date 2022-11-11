import {Link, useParams} from "react-router-dom";
import {useContext} from "react";
import {ConfigContext} from "../utils/ConfigContext";

export function ConfigEditHomePage() {
    const params = useParams();
    const [globalConfig, setGlobalConfig] = useContext(ConfigContext);
    const currentConfig = globalConfig.list.find(i => i.id === parseInt(params.id))

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
                <h2 className="text-center my-3">What would you like to change?</h2>
            </div>
        </div>
    );
}

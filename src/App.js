import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import {GamePage} from "./pages/GamePage";
import ConfigPage from "./pages/ConfigPage";
import {ConfigContext} from "./utils/ConfigContext";
import {useState} from "react";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";

function App() {
    const currentConfig = useState({list: [], config : null})
    return (
        <div className="app-main">
            <ConfigContext.Provider value={currentConfig}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" index element={<Home/>}/>
                        <Route path="/game" index element={<GamePage/>}/>
                        <Route path="/config" index element={<ConfigPage/>}/>
                    </Routes>
                </BrowserRouter>

            </ConfigContext.Provider>
        </div>
    );
}

Math.getRandom = function(min = 0, max = 1) {
    return Math.random() * (max - min) + min;
}

export default App;

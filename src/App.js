import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import {GamePage} from "./pages/GamePage";
import ConfigPage from "./pages/ConfigPage";
import {ConfigContext} from "./utils/ConfigContext";
import {useState} from "react";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
import {ConfigEditHomePage} from "./pages/ConfigEditHomePage";
import ConfigSessionPage from "./pages/ConfigSessionPage";

function App() {
    const currentConfig = useState({list: [], config : null})
    return (
        <div className="app-main App">
            <ConfigContext.Provider value={currentConfig}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" index element={<Home/>}/>
                        <Route path="/game" element={<GamePage/>}/>
                        <Route path="/config" element={<ConfigPage/>}/>
                        <Route path="/edit-config/:id" element={<ConfigEditHomePage/>}/>
                        <Route path="/edit-session/:id" element={<ConfigSessionPage/>}/>
                    </Routes>
                </BrowserRouter>

            </ConfigContext.Provider>
        </div>
    );
}

Math.getRandom = function(min = 0, max = 1) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default App;

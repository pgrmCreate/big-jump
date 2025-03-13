import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import {GamePage} from "./pages/GamePage";
import ConfigPage from "./pages/ConfigPage";
import {ConfigContext} from "./utils/ConfigContext";
import {useContext, useEffect, useState} from "react";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
import {ConfigEditHomePage} from "./pages/ConfigEditHomePage";
import ConfigSessionPage from "./pages/ConfigSessionPage";
import {UserContext} from "./utils/UserContext";
import {Requester} from "./class/Requester";
import {useCookies} from "react-cookie";
import Modal from 'react-modal';


function App() {
    const currentConfig = useState({list: [], config: null});
    const userConfig = useState(null);
    const [cookies, setCookie, removeCookies] = useCookies(['cookie-name']);

    Modal.setAppElement('#root');

    useEffect(() => {
        reconnect();
    }, [])

    function reconnect () {
        if(cookies.user && cookies.user.token) {
            Requester.get('/api/user/reconnect', true)
                .then(res => res.json())
                .then(data => {
                    if(data.error) {
                        removeCookies('user')
                        return;
                    }

                    userConfig[1](cookies.user);
                    Requester.token = cookies.user.token;
                }).catch((error) => {
                removeCookies('user')
            });
        }
    }

    return (
        <div className="app-main App">
            <UserContext.Provider value={userConfig}>
                <ConfigContext.Provider value={currentConfig}>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" index element={<Home/>}/>
                            <Route path="/game/:id" element={<GamePage/>}/>
                            <Route path="/config" element={<ConfigPage/>}/>
                            <Route path="/edit-config/:id" element={<ConfigPage/>}/>
                            <Route path="/edit-session/:id" element={<ConfigSessionPage/>}/>
                        </Routes>
                    </BrowserRouter>
                </ConfigContext.Provider>
            </UserContext.Provider>
        </div>
    );
}

Math.getRandom = function (min = 0, max = 1) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default App;

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import {GamePage} from "./pages/GamePage";
import ConfigPage from "./pages/ConfigPage";

function App() {
    return (
        <div className="app-main">
            <ConfigPage/>
        </div>
    );
}

Math.getRandom = function(min = 0, max = 1) {
    return Math.random() * (max - min) + min;
}

export default App;

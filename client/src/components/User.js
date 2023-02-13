import './User.css';
import {Requester} from "../class/Requester";
import {useContext, useEffect, useState} from "react";
import {UserContext} from "../utils/UserContext";
import {useCookies} from "react-cookie";

export default function User() {
    const [openUserSetup, setOpenUserSetup] = useState(false);
    const [errorLogin, setErrorLogin] = useState(false)
    const [loginInput, setLoginInput] = useState({
        email: '',
        password: ''
    });
    const [user, setUser] = useContext(UserContext);
    const [, setCookie, removeCookies] = useCookies(['cookie-name']);

    function signup() {
        Requester.post('/api/user/signup', {email : 'dd@dd.com', password : 'passpass'})
    }

    function handleChangeLoginInput(key, value) {
        setLoginInput({...loginInput, [key] : value});
    }

    function login(e) {
        e.preventDefault();

        Requester.post('/api/user/login', {email : loginInput.email, password : loginInput.password}, true)
            .then(res => res.json())
            .then((data = {}) => {
                if(data.error) {
                    setErrorLogin(true);
                    return;
                }

                setCookie('user', JSON.stringify(data), { path: '/' });
                Requester.token = data.token;
                setUser(data);
                setOpenUserSetup(false);
                setErrorLogin(false);
            }).catch((error) => {
                removeCookies('user')
            });
    }

    function disconnect() {
        removeCookies('user');
        setUser(null);
    }

    return <div className="user-container">
        { !user && (
            <div className="user-setup" onClick={() => setOpenUserSetup(!openUserSetup)}>
                <i className="fa-solid fa-circle-user btn-user"></i>
            </div>
        )}

        { user && (
            <div className="user-setup">
                <p className="user-connected">
                    { user.email }

                    <i className="fa-solid fa-power-off btn-disconnect mx-2" onClick={() => disconnect()}></i>
                </p>
            </div>
        )}


        { openUserSetup && (
            <div className="popin-container">
                <div className="popin-content">
                    <span className="popin-close" onClick={() => setOpenUserSetup(false)}>
                        <i className="fa-solid fa-xmark"></i>
                    </span>
                    <form>
                        <input type="text" className="form-control mb-2" placeholder="email" value={loginInput.email}
                               onChange={(e) => handleChangeLoginInput('email', e.target.value)}/>

                        <input type="password" className="form-control mb-4" placeholder="mot de passe" value={loginInput.password}
                               onChange={(e) => handleChangeLoginInput('password', e.target.value)}/>

                        <button className="btn btn-primary" onClick={(e) => login(e)}>
                            <i className="fa-solid fa-circle-user mx-2"></i>
                            Se connecter
                        </button>

                        { errorLogin && (
                            <p className="alert alert-danger my-3">
                                Erreur d'authentification
                            </p>
                        )}
                    </form>
                </div>
            </div>
        )}
    </div>
}

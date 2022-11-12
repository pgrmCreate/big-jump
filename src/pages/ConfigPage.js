import './ConfigPage.css';
import {Map} from "../components/Map";
import {useContext, useState} from "react";
import {GameConfig} from "../class/GameConfig";
import {ConfigContext} from "../utils/ConfigContext";
import {Link, useNavigate} from 'react-router-dom';

export default function ConfigPage () {
    const [configStep, setConfigStep] = useState(1);
    const [zoneGroup, setZoneGroup] = useState([]);
    const [config, setConfig] = useState({'config' : new GameConfig()});
    const [pickedZoneGroup, setPickedZoneGroup] = useState(null);
    const [targetLevelConfig, setTargetLevelConfig] = useState(null);
    const [globalConfig, setGlobalConfig] = useContext(ConfigContext);
    const navigate = useNavigate();
    const [colorSelect, setColorSelect] = useState('#ee9c08');

    function updateConfig() {
        setConfig({config : config.config});
    }

    function addGroupeZone() {
        setZoneGroup([...zoneGroup, []]);
    }

    function setSizeMap(key, value) {
        value = parseInt(value) + 2;
        config.config.setup[key] = value;
        updateConfig();
    }

    function selectZone(e) {
        const targetZone = e.target.dataset.targetZone;

        setPickedZoneGroup(parseInt(targetZone));
    }

    function deleteZone(e) {
        const targetZone = parseInt(e.target.dataset.targetZoneD);

        setPickedZoneGroup(null);
        zoneGroup.map((item) => {
            config.config.setup.zones.filter(i => i.id === item)
        })
        setZoneGroup(zoneGroup.filter((e, i) => i !== targetZone));
        updateConfig();
    }

    function handleZonePicked(zoneList, targetZone, params, isSelected) {
        const targetRect = zoneList[targetZone];
        const targetX = Math.floor(targetRect.x / params.sizeGrid);
        const targetY = Math.floor(targetRect.y / params.sizeGrid);

        const newGroupZone = [...zoneGroup];

        if(isSelected) {
            const targetNewZoneId = config.config.createZone(targetX, targetY, colorSelect, pickedZoneGroup);
            newGroupZone[pickedZoneGroup].push(targetNewZoneId);
            setZoneGroup(newGroupZone);
            updateConfig();
        } else {
            config.config.setup.zones = config.config.setup.zones.filter(item => {
                return !(item.x === targetX && item.y === targetY && item.targetGroupZone === pickedZoneGroup)
            });

            updateConfig();
        }
    }


    function saveStep(e) {
        const targetNav = parseInt(e.target.dataset.targetNav);

        if(targetNav === 5 || targetNav === 4 || targetNav === 3) {
            setTargetLevelConfig(null);
        }

        if(targetNav === 3) {
            config.config.setup.lots = [];
            setTargetLevelConfig(null);
        }

        if(targetNav === 4) {
            for(let i = 0 ; i < config.config.setup.gainLevelAmount ; i++) {
                config.config.createLot(true, i+1, 14, 25, 3, []);
            }

            for(let i = 0 ; i < config.config.setup.threatLevelAmount ; i++) {
                config.config.createLot(false, i+1, 14, 25, 3, []);
            }
        }

        setConfigStep(targetNav);

        if(targetNav === 5) {
            setTargetLevelConfig(null);
        }
    }

    function getZoneFromId(zoneList) {
        return config.config.setup.zones.find(i => zoneList.indexOf(i.id) > -1);
    }

    function getZoneAttributFromGroup(targetZones, targetKey) {
        if(zoneGroup.length === 0) return 'Pas de zone';

        const firstZoneType = getZoneFromId(targetZones);

        if(targetKey === 'empty') {
            return Math.floor((1 - (firstZoneType.percentWin + firstZoneType.percentLoose)) * 100);
        }

        if(targetKey === 'win') {
            return around2Decimales(firstZoneType.percentWin);
        }

        if(targetKey === 'loose') {
            return around2Decimales(firstZoneType.percentLoose);
        }

        if(targetKey === 'isVisible') {
            return firstZoneType.isVisible
        }
    }

    function around2Decimales(value) {
        return Math.round(value * 100) / 100
    }

    function changeZoneConfig(targetZoneGroup, key, value) {
        function checkingAjustingPercent(keyAjust, valueAjust, itemAjust) {
            if((itemAjust.percentWin + itemAjust.percentLoose) > 1) {
                if(key === 'percentWin') {
                    itemAjust.percentLoose = 1 - around2Decimales(itemAjust['percentWin']);
                } else {
                    itemAjust.percentWin = 1 - around2Decimales(itemAjust['percentLoose']);
                }
            }
        }
        config.config.setup.zones.map((item) => {
            targetZoneGroup.forEach((elementZone) => {
                if(elementZone === item.id) {
                    // Decimal property
                    if(key === 'percentWin' || key === 'percentLoose') {
                        item[key] = around2Decimales(value / 100);
                        checkingAjustingPercent(key, value, item);
                        return;
                    }

                    item[key] = value;
                }
            })
        });

        updateConfig();
    }

    function changeGlobalConfig(key, value, isNumber = false) {
        if(isNumber) {
            if(isNaN(value)) {
                console.error('Input value is not a number for', key);
            }
            value = parseInt(value);
        }

        config.config.setup[key] = value;

        updateConfig();
    }

    function changeLotConfig(key, value, typeAction = 'exploration') {
        const targetLotIndex = config.config.setup.lots.findIndex(i => i[typeAction].id === targetLevelConfig);

        if(['maxDraw', 'earnPointMin', 'earnPointMax'].indexOf(key) > -1) {
            value = parseInt(value);
        }

        if(!isNaN(value) && value === '') {
            value = 0;
        }

        config.config.setup.lots[targetLotIndex][typeAction][key] = value;

        updateConfig();
    }

    function isLotContainZone(targetGroupeZoneIndex, typeAction = 'exploration') {
        const targetLotApplyZone = config.config.setup.lots.find(i => i[typeAction].id === targetLevelConfig)[typeAction].applyZones;

        return targetLotApplyZone.filter(item => zoneGroup[targetGroupeZoneIndex].indexOf(item) > -1).length > 0;
    }

    function zoneApplyChange(targetGroupeZoneIndex, typeAction = 'exploration') {
        let targetLotApplyZone = config.config.setup.lots.find(i => i[typeAction].id === targetLevelConfig)[typeAction].applyZones;

        if(isLotContainZone(targetGroupeZoneIndex, typeAction)) {
            // Uncheck zone apply
            zoneGroup[targetGroupeZoneIndex].map(zone => {
                targetLotApplyZone = targetLotApplyZone.filter(item => item !== zone);
            })
        } else {
            // Check zone apply
            zoneGroup[targetGroupeZoneIndex].map(zone => {
                targetLotApplyZone.push(zone)
            })
        }

        config.config.setup.lots.find(i => i[typeAction].id === targetLevelConfig)[typeAction].applyZones = targetLotApplyZone;
        updateConfig();
    }

    function saveMap() {
        const targetId = config.config.id;

        setGlobalConfig({list : [...globalConfig.list, config.config], config: null});

        navigate('/edit-session/' + targetId);
    }

    return (
        <div>
            <div className="page-container">
                <div className="d-flex justify-content-between align-items-center">
                    <Link to="/" className="btn btn-primary mx-2">
                        <i className="fa-solid fa-bars mx-2"/>
                        Menu
                    </Link>

                    <h1 className="text-center mx-4">New experience (step <b>{ configStep}</b>)</h1>
                </div>
            </div>

            <div>
                { configStep === 1 && (
                    <div className="container">
                        <div className="row">
                            <div className="col-4 my-2">
                                <h2 className="text-center">Map configuration</h2>
                            </div>

                            <div className="col-8">
                                <div>
                                    <fieldset className="d-flex flex-column mb-2">
                                        <div className="">
                                            <input type="text" className="form-control" placeholder="Experience name"
                                                   value={config.config.setup.name}
                                                   onChange={(e) => { changeGlobalConfig('name', e.target.value)}}
                                            />
                                        </div>
                                    </fieldset>
                                </div>
                            </div>

                            <div className="col-4">
                                <div className="">
                                    <fieldset className="mb-2">
                                        <h3>Map size</h3>

                                        <div className="d-flex">
                                            <input type="number" className="form-control mx-2" placeholder="Width"
                                                   onChange={(e) => setSizeMap('width', e.target.value, true)}
                                                   value={config.config.setup.width - 2}/>

                                            <input type="number" className="form-control mx-2" placeholder="Height"
                                                   onChange={(e) => setSizeMap('height', e.target.value, true)}
                                                   value={config.config.setup.height - 2}/>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>

                            <div className="col-8">
                                <div className="">
                                    <fieldset>
                                        <h3>Start position</h3>

                                        <div className="d-flex">
                                            <input type="number" className="form-control mx-2" placeholder="x" value={config.config.setup.initPositionX}
                                                   onChange={(e) => { changeGlobalConfig('initPositionX', e.target.value, true)}}/>

                                            <input type="number" className="form-control mx-2" placeholder="y" value={config.config.setup.initPositionY}
                                                   onChange={(e) => { changeGlobalConfig('initPositionY', e.target.value, true)}}/>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>

                            <div className="col-4">
                                <fieldset>
                                    <h3>
                                        Zones <br/>
                                    </h3>

                                    <div className="d-flex align-items-center">
                                        <button className="btn btn-sm btn-success mx-2 my-2" onClick={addGroupeZone}>
                                            <i className="fa-solid fa-plus"/> Ajouter
                                        </button>

                                        <label className="d-flex align-items-center">
                                            select color zone
                                            <input className="mx-2" type="color" value={colorSelect}
                                            onChange={(e) => { setColorSelect(e.target.value)}}/>
                                        </label>
                                    </div>

                                    { zoneGroup.length === 0 && (
                                        <p className="alert alert-warning">
                                            Need 1 zone minimum
                                        </p>
                                    )}

                                    <div className="zones-container">
                                        { zoneGroup.map((item, currentIndex) => (
                                            <div className={"zones-row " + ((pickedZoneGroup === currentIndex) ? 'zone-selected' : '')}
                                                 key={currentIndex}>
                                                <p>
                                                    <span data-target-zone={currentIndex} onClick={selectZone}>
                                                        Zone #{currentIndex}
                                                    </span>

                                                    {(pickedZoneGroup === currentIndex) && (
                                                        <button className="btn-sm btn-danger"
                                                                onClick={deleteZone} data-target-zone-d={currentIndex}>
                                                            <i className="fa-solid fa-trash mx-2"/>
                                                            delete
                                                        </button>
                                                    )}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>
                            </div>

                            <div className="col-8">
                                <div className="grid-editor-container">
                                    <Map modeEditor={true} config={config} handleZonePicked={handleZonePicked}
                                            targetGroupZone={pickedZoneGroup} zoneGroup={zoneGroup}/>
                                </div>

                                <div className="d-flex justify-content-end">
                                    <button type="button" onClick={saveStep} data-target-nav={2}
                                            disabled={config.config.setup.name === '' || zoneGroup.length === 0}
                                            className="btn btn-primary">
                                        <i className="fa-solid fa-arrow-right mx-2" data-target-nav={2}/>Save map / Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div>
                { configStep === 2 && (
                    <div className="container">
                        <div className="row">
                            <div className="col-12 my-3 text-center">
                                <h2 className="text-center">Zones configuration</h2>
                            </div>

                            <div className="col-12">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Zone visibility</th>
                                            <th>% Empty zone </th>
                                            <th>% Gain zone</th>
                                            <th>% Threat zone</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                    { zoneGroup.map((currentZoneGroup, currentIndex) => (
                                        <tr key={currentIndex}>
                                            <th>Zone n°{ currentIndex }</th>
                                            <td>
                                                { !getZoneAttributFromGroup(currentZoneGroup, 'isVisible') && (
                                                    <i className="fa-solid fa-square"
                                                       onClick={() => changeZoneConfig(currentZoneGroup, 'isVisible', false)}/>
                                                )}

                                                { getZoneAttributFromGroup(currentZoneGroup, 'isVisible') && (
                                                    <i className="fa-solid fa-square-check"
                                                       onClick={() => changeZoneConfig(currentZoneGroup, 'isVisible', true)}/>
                                                )}
                                            </td>
                                            <td>{ getZoneAttributFromGroup(currentZoneGroup, 'empty')}% </td>
                                            <td>
                                                <input type="number" className="form-control"
                                                       onChange={(e) => changeZoneConfig(currentZoneGroup, 'percentWin', e.target.value, true)}
                                                       value={around2Decimales(getZoneAttributFromGroup(currentZoneGroup, 'win') * 100)}/>
                                            </td>
                                            <td>
                                                <input type="number" className="form-control"
                                                       onChange={(e) => changeZoneConfig(currentZoneGroup, 'percentLoose', e.target.value, true)}
                                                       value={around2Decimales(getZoneAttributFromGroup(currentZoneGroup, 'loose') * 100)}/>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="col-12 config-navigation-container">
                                <div className="d-flex justify-content-start">
                                    <button type="button" onClick={saveStep} data-target-nav={1}
                                            className="btn btn-primary">
                                        <i className="fa-solid fa-arrow-left mx-2" data-target-nav={1}/> Back
                                    </button>
                                </div>

                                <div className="d-flex justify-content-end">
                                    <button type="button" onClick={saveStep} data-target-nav={3}
                                            className="btn btn-primary">
                                        <i className="fa-solid fa-arrow-right mx-2" data-target-nav={3}/>Save map / Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            { configStep === 3 && (
                <div className="container">
                    <div className="row">
                        <div className="col-12 my-3 text-center">
                            <h2 className="text-center">Points configuration</h2>
                        </div>

                        <div className="col-4 config-split-main-container">
                            <h3 className="text-center my-2">Global configuration</h3>

                            <div>
                                <label className="my-2">
                                    Total player points
                                    <input className="form-control" type="number" value={config.config.setup.finalScore}
                                    onChange={(e) => { changeGlobalConfig('finalScore', e.target.value, true)}}/>
                                </label>

                                <label className="my-2">
                                    Initial player score
                                    <input className="form-control" type="number" value={config.config.setup.startPoint}
                                           onChange={(e) => { changeGlobalConfig('startPoint', e.target.value, true)}}/>
                                </label>

                                <label className="my-2">
                                    Amount of gain level
                                    <input className="form-control" type="number" value={config.config.setup.gainLevelAmount}
                                           onChange={(e) => { changeGlobalConfig('gainLevelAmount', e.target.value, true)}}/>
                                </label>

                                <label className="my-2">
                                    Amount of threat level
                                    <input className="form-control" type="number" value={config.config.setup.threatLevelAmount}
                                           onChange={(e) => { changeGlobalConfig('threatLevelAmount', e.target.value, true)}}/>
                                </label>

                                <label className="my-2">
                                    Try amount by session
                                    <input className="form-control" type="number" value={config.config.setup.roundLeftMax}
                                           onChange={(e) => { changeGlobalConfig('roundLeftMax', e.target.value, true)}}/>
                                </label>
                            </div>
                        </div>

                        <div className="col-4 config-split-main-container">
                            <h3 className="text-center mt-2 mb-5">Gain logic between level</h3>
                            <div className="select-setup-container">
                                <div className={"select-setup" + (config.config.setup.drawTypeGain === 'sequential' ? ' draw-active' : '')}
                                onClick={() => { changeGlobalConfig('drawTypeGain', 'sequential')}}>
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeGain !== 'sequential' ? ' d-none' : '')}/>
                                        Sequential draw
                                    </p>
                                </div>

                                <div className={"select-setup" + (config.config.setup.drawTypeGain === 'random' ? ' draw-active' : '')}
                                     onClick={() => { changeGlobalConfig('drawTypeGain', 'random')}}>
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeGain !== 'random' ? ' d-none' : '')}/>
                                        Random draw
                                    </p>
                                </div>

                                <div className={"select-setup" + (config.config.setup.drawTypeGain === 'semi-random' ? ' draw-active' : '')}
                                     >
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeGain !== 'semi-random' ? ' d-none' : '')}/>
                                        Semi-random draw
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-4 config-split-main-container">
                            <h3 className="text-center mt-2 mb-5">Threat logic between level</h3>

                            <div className="select-setup-container">
                                <div className={"select-setup" + (config.config.setup.drawTypeThreat === 'sequential' ? ' draw-active' : '')}
                                     onClick={() => { changeGlobalConfig('drawTypeThreat', 'sequential')}}>
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeThreat !== 'sequential' ? ' d-none' : '')}/>
                                        Sequential draw
                                    </p>
                                </div>

                                <div className={"select-setup" + (config.config.setup.drawTypeThreat === 'random' ? ' draw-active' : '')}
                                     onClick={() => { changeGlobalConfig('drawTypeThreat', 'random')}}>
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeThreat !== 'random' ? ' d-none' : '')}/>
                                        Random draw
                                    </p>
                                </div>

                                <div className={"select-setup" + (config.config.setup.drawTypeThreat === 'semi-random' ? ' draw-active' : '')}
                                     >
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeThreat !== 'semi-random' ? ' d-none' : '')}/>
                                        Semi-random draw
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 config-navigation-container">
                            <div className="d-flex justify-content-start">
                                <button type="button" onClick={saveStep} data-target-nav={2}
                                        className="btn btn-primary">
                                    <i className="fa-solid fa-arrow-left mx-2" data-target-nav={2}/> Back
                                </button>
                            </div>

                            <div className="d-flex justify-content-end">
                                <button type="button" onClick={saveStep} data-target-nav={4}
                                        className="btn btn-primary">
                                    <i className="fa-solid fa-arrow-right mx-2" data-target-nav={4}/>
                                    Save map / Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            { configStep === 4 && (
                <div className="container">
                    <div className="row">
                        <div className="col-12 my-3 text-center">
                            <h2 className="text-center">Gain category setup</h2>
                        </div>

                        <div className="col-4 config-split-main-container">
                            <h3 className="text-center mt-2 mb-5">Levels picking</h3>

                            <div className="select-setup-container" >
                                { config.config.setup.lots.filter(i => i.exploration.isWin).map((currentLot, index) => (
                                    <div className={"select-setup" + (targetLevelConfig === currentLot.exploration.id ? ' draw-active' : '')} key={currentLot.exploration.id}
                                         onClick={(e) => setTargetLevelConfig(currentLot.exploration.id)}>
                                        <p>
                                            Level { index }
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        { targetLevelConfig !== null && (
                            <div className="col-4 config-split-main-container">
                                <h3 className="text-center mt-2 mb-5">Exploration</h3>

                                <div>
                                    <label className="d-flex my-2 align-content-center align-items-center">
                                        Points interval
                                        <input className="form-control mx-1" type="number" placeholder="From"
                                               value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.earnPointMin}
                                                onChange={(e) => changeLotConfig('earnPointMin', e.target.value, 'exploration')}/>
                                        <span className="mx-1">to</span>
                                        <input className="form-control mx-1" type="number" placeholder="to"
                                               value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.earnPointMax}
                                               onChange={(e) => changeLotConfig('earnPointMax', e.target.value, 'exploration')}
                                        />
                                    </label>
                                </div>

                                <label className="my-2">
                                    Max draw
                                    <input className="form-control mx-1" type="number" placeholder="Max draw"
                                           value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.maxDraw}
                                           onChange={(e) => changeLotConfig('maxDraw', e.target.value, 'exploration')}
                                    />
                                </label>

                                <label className="my-2">
                                    Zones apply
                                    { zoneGroup.map((item, index) => (
                                        <div key={index}>
                                             { !isLotContainZone(index, 'exploration') && (
                                                <p>
                                                    <i className="fa-solid fa-square mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploration')}/>
                                                    Zone { index }
                                                </p>
                                            )}

                                            { isLotContainZone(index, 'exploration') && (
                                                <p>
                                                    <i className="fa-solid fa-square-check mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploration')}/>
                                                    Zone { index }
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </label>
                            </div>
                            )}

                        { targetLevelConfig !== null && (
                            <div className="col-4 config-split-main-container">
                                <h3 className="text-center mt-2 mb-5">Exploitation</h3>

                                <div>
                                    <label className="d-flex my-2 align-content-center align-items-center">
                                        Points interval
                                        <input className="form-control mx-1" type="number" placeholder="From"
                                               value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.earnPointMin}
                                                onChange={(e) => changeLotConfig('earnPointMin', e.target.value, 'exploitation')}/>
                                        <span className="mx-1">to</span>
                                        <input className="form-control mx-1" type="number" placeholder="to"
                                               /*value={config.config.setup.lots.[targetLevelConfig].exploitation.earnPointMax}*/
                                               value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.earnPointMax}
                                               onChange={(e) => changeLotConfig('earnPointMax', e.target.value, 'exploitation')}
                                        />
                                    </label>
                                </div>

                                <label className="my-2">
                                    Max draw
                                    <input className="form-control mx-1" type="number" placeholder="Max draw"
                                           value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.maxDraw}
                                           onChange={(e) => changeLotConfig('maxDraw', e.target.value, 'exploitation')}
                                    />
                                </label>

                                <label className="my-2">
                                    { zoneGroup.map((item, index) => (
                                        <div key={index}>
                                            { !isLotContainZone(index, 'exploitation') && (
                                                <p>
                                                    <i className="fa-solid fa-square mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploitation')}/>
                                                    Zone { index }
                                                </p>
                                            )}

                                            { isLotContainZone(index, 'exploitation') && (
                                                <p>
                                                    <i className="fa-solid fa-square-check mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploitation')}/>
                                                    Zone { index }
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </label>
                            </div>
                        )}



                        <div className="col-12 config-navigation-container">
                            <div className="d-flex justify-content-start">
                                <button type="button" onClick={saveStep} data-target-nav={3}
                                        className="btn btn-primary">
                                    <i className="fa-solid fa-arrow-left mx-2" data-target-nav={3}/> Back
                                </button>
                            </div>

                            <div className="d-flex justify-content-end">
                                <button type="button" onClick={saveStep} data-target-nav={5}
                                        className="btn btn-primary">
                                    <i className="fa-solid fa-arrow-right mx-2" data-target-nav={5}/>
                                    Save map / Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            { configStep === 5 && (
                <div className="container">
                    <div className="row">
                        <div className="col-12 my-3 text-center">
                            <h2 className="text-center">Threat category setup</h2>
                        </div>

                        <div className="col-4 config-split-main-container">
                            <h3 className="text-center mt-2 mb-5">Levels picking</h3>

                            <div className="select-setup-container" >
                                { config.config.setup.lots.filter(i => !i.exploration.isWin).map((currentLot, index) => (
                                    <div className={"select-setup" + (targetLevelConfig === currentLot.exploration.id ? ' draw-active' : '')} key={currentLot.exploration.id}
                                         onClick={(e) => setTargetLevelConfig(currentLot.exploration.id)}>
                                        <p>
                                            Level { index }
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        { targetLevelConfig !== null && (
                            <div className="col-4 config-split-main-container">
                                <h3 className="text-center mt-2 mb-5">Exploration</h3>

                                <div>
                                    <label className="d-flex my-2 align-content-center align-items-center">
                                        Points interval
                                        <input className="form-control mx-1" type="number" placeholder="From"
                                               value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.earnPointMin}
                                               onChange={(e) => changeLotConfig('earnPointMin', e.target.value, 'exploration')}/>
                                        <span className="mx-1">to</span>
                                        <input className="form-control mx-1" type="number" placeholder="to"
                                               value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.earnPointMax}
                                               onChange={(e) => changeLotConfig('earnPointMax', e.target.value, 'exploration')}
                                        />
                                    </label>
                                </div>

                                <label className="my-2">
                                    Max draw
                                    <input className="form-control mx-1" type="number" placeholder="Max draw"
                                           value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.maxDraw}
                                           onChange={(e) => changeLotConfig('maxDraw', e.target.value, 'exploration')}
                                    />
                                </label>

                                <label className="my-2">
                                    Zones apply
                                    { zoneGroup.map((item, index) => (
                                        <div key={index}>
                                            { !isLotContainZone(index, 'exploration') && (
                                                <p>
                                                    <i className="fa-solid fa-square mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploration')}/>
                                                    Zone { index }
                                                </p>
                                            )}

                                            { isLotContainZone(index, 'exploration') && (
                                                <p>
                                                    <i className="fa-solid fa-square-check mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploration')}/>
                                                    Zone { index }
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </label>
                            </div>
                        )}

                        { targetLevelConfig !== null && (
                            <div className="col-4 config-split-main-container">
                                <h3 className="text-center mt-2 mb-5">Exploitation</h3>

                                <div>
                                    <label className="d-flex my-2 align-content-center align-items-center">
                                        Points interval
                                        <input className="form-control mx-1" type="number" placeholder="From"
                                               value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.earnPointMin}
                                               onChange={(e) => changeLotConfig('earnPointMin', e.target.value, 'exploitation')}/>
                                        <span className="mx-1">to</span>
                                        <input className="form-control mx-1" type="number" placeholder="to"
                                               value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.earnPointMax}
                                               onChange={(e) => changeLotConfig('earnPointMax', e.target.value, 'exploitation')}
                                        />
                                    </label>
                                </div>

                                <label className="my-2">
                                    Max draw
                                    <input className="form-control mx-1" type="number" placeholder="Max draw"
                                           value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.maxDraw}
                                           onChange={(e) => changeLotConfig('maxDraw', e.target.value, 'exploitation')}
                                    />
                                </label>

                                <label className="my-2">
                                    Zones apply
                                    { zoneGroup.map((item, index) => (
                                        <div key={index}>
                                            { !isLotContainZone(index, 'exploitation') && (
                                                <p>
                                                    <i className="fa-solid fa-square mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploitation')}/>
                                                    Zone { index }
                                                </p>
                                            )}

                                            { isLotContainZone(index, 'exploitation') && (
                                                <p>
                                                    <i className="fa-solid fa-square-check mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploitation')}/>
                                                    Zone { index }
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </label>
                            </div>
                        )}



                        <div className="col-12 config-navigation-container">
                            <div className="d-flex justify-content-start">
                                <button type="button" onClick={saveStep} data-target-nav={4}
                                        className="btn btn-primary">
                                    <i className="fa-solid fa-arrow-left mx-2" data-target-nav={4}/> Back
                                </button>
                            </div>

                            <div className="d-flex justify-content-end">
                                <button type="button" onClick={saveMap}
                                        className="btn btn-primary">
                                    <i className="fa-solid fa-floppy-disk mx-2"/>
                                    Next config
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

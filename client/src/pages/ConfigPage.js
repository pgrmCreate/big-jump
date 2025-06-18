import './ConfigPage.css';
import {Map} from "../components/Map";
import {useContext, useEffect, useRef, useState} from "react";
import {GameConfig} from "../class/GameConfig";
import {ConfigContext} from "../utils/ConfigContext";
import {Link, useNavigate, useParams} from 'react-router-dom';
import {Requester} from "../class/Requester";
import {ControllerConfigPanel} from "../components/ControllerConfigPanel";
import NumericInput from "../components/NumericInput";

export default function ConfigPage() {
    const params = useParams();
    const [configStep, setConfigStep] = useState(null);
    const [zoneGroup, setZoneGroup] = useState([]);
    const [zoneGroupName, setZoneGroupName] = useState({});
    const [zoneGroupColor, setZoneGroupColor] = useState({});
    const [config, setConfig] = useState(null);
    const [pickedZoneGroup, setPickedZoneGroup] = useState(null);
    const [targetLevelConfig, setTargetLevelConfig] = useState(null);
    const [simpleIndexLevelPicked, setSimpleIndexLevelPicked] = useState(0);
    const [globalConfig, setGlobalConfig] = useContext(ConfigContext);
    const [pageZoneConfigError, setPageZoneConfigError] = useState(false);
    const navigate = useNavigate();
    const [colorSelect, setColorSelect] = useState('#ee9c08');
    const [isLevelNeedEdit, setIsLevelNeedEdit] = useState(true);
    const mapRef = useRef(null);
    const [errorMapGenerate, setErrorMapGenerate] = useState(false);
    const [isMapDisplay, setIsMapDisplay] = useState(true);
    const [sameConfigExploit, setSameConfigExploit] = useState(true);
    const [lastColorAdded, setLastColorAdded] = useState('#FFCC00');
    const [isErrorDrawAmount, setIsErrorDrawAmount] = useState(false);
    const [isConfirmGenerateMap, setIsConfirmGenerateMap] = useState(false);

    useEffect(() => {
        if (params.id) {
            const currentConfig = globalConfig.list.find(i => i.setup._id === params.id);

            const newGroupMade = makeZoneGroup(currentConfig);

            const colorBuilder = {};
            newGroupMade.forEach((group, index) => {
                colorBuilder[index] = currentConfig.setup.zones.find(i => i.id === group[0]).color;
            });
            setZoneGroupColor(colorBuilder);

            const nameBuilder = {};
            newGroupMade.forEach((group, index) => {
                nameBuilder[index] = currentConfig.setup.zones.find(i => i.id === group[0]).name;
            });
            setZoneGroupName(nameBuilder);

            setConfig({config: currentConfig});

            setIsLevelNeedEdit(false);
            setConfigStep(1)
        } else {
            const newConfig = new GameConfig();
            makeZoneGroup(newConfig);
            setConfig({'config': newConfig});
            setConfigStep(1)
        }
    }, []);

    // Effet pour réagir aux changements de isMapDisplay
    useEffect(() => {
        // Vérifiez si isMapDisplay est true et si mapRef.current est défini
        if (isMapDisplay && mapRef.current) {
            mapRef.current.generateMap();
        }
    }, [isMapDisplay]);

    function generateMap(withConfirm = false) {
        if (withConfirm) {
            setZoneGroup([]);
        }

        setIsConfirmGenerateMap(false);
        if (config.config.setup.width < 4 || config.config.setup.height < 4 || config.config.setup.height > 102
            || config.config.setup.width > 102) {
            setErrorMapGenerate(true);
            setIsMapDisplay(false);
            return;
        }

        setIsMapDisplay(true);
        setErrorMapGenerate(false);
    }

    function makeZoneGroup(targetSpecificConfig = null) {
        let targetConfig = null;
        const zoneGroupeBuilder = {};
        const targetNewGroupe = [];

        if (targetSpecificConfig) {
            targetConfig = targetSpecificConfig;
        } else {
            targetConfig = config.config;
        }

        const newKeyGroupZone = [];

        targetConfig.setup.zones.map((currentZone) => {
            if (newKeyGroupZone.indexOf(currentZone.targetGroupZone) === -1) {
                zoneGroupeBuilder[currentZone.targetGroupZone] = [];
                newKeyGroupZone.push(currentZone.targetGroupZone);
            }

            zoneGroupeBuilder[currentZone.targetGroupZone].push(currentZone.id);
        });

        Object.keys(zoneGroupeBuilder).forEach(k => targetNewGroupe.push(zoneGroupeBuilder[k]));

        setZoneGroup(targetNewGroupe);
        return targetNewGroupe;
    }

    function removeCaseOutMap() {
        const currentHeight = config.config.setup.height - 2;
        const currentWidth = config.config.setup.width - 2;

        let needChangeGroup = false;
        config.config.setup.zones = config.config.setup.zones.filter(zone => {
            const isZoneInGrid = zone.x <= currentWidth && zone.y <= currentHeight;

            if(!isZoneInGrid)
                needChangeGroup = true;

            return isZoneInGrid;
        });

        if(needChangeGroup) {
            makeZoneGroup();
            updateConfig();
        }
    }

    function haveExistingCase(zones, x, y, excludeGroup = null) {
        if (!Array.isArray(zones)) {
            console.error('haveExistingCase ➜ le premier argument doit être un tableau de zones');
            return false;
        }

        return zones.some(z => {
            const sameCoords = z.x === x && z.y === y;
            const isExcluded = excludeGroup !== null && z.targetGroupZone === excludeGroup;
            return sameCoords && !isExcluded;
        });
    }

    function getValidConfigStep1() {
        if (!config.config.setup.height || !config.config.setup.width ||
            config.config.setup.zones.length === 0)
            return true;

        return (config.config.setup.name === '' || zoneGroup.length === 0
            || config.config.setup.width < 4 || config.config.setup.height < 4 || config.config.setup.height > 102
            || config.config.setup.width > 102);
    }

    function updateConfig() {
        setConfig({config: config.config});
    }

    function addGroupeZone() {
        if (config.config.setup.zones.length > 30)
            return;

        setZoneGroupName({...zoneGroupName, [zoneGroup.length]: 'zone #' + zoneGroup.length});
        setZoneGroupColor({...zoneGroupColor, [zoneGroup.length]: '#FFCC00'});
        setZoneGroup([...zoneGroup, []]);
    }

    function setSizeMap(key, value) {
        if (value < 0 || value === '') {
            setIsMapDisplay(false);
            return;
        }

        value = parseInt(value) + 2;
        config.config.setup[key] = value;
        updateConfig();
        removeCaseOutMap();
    }

    function selectZone(e) {
        const targetZone = e.target.dataset.targetZone;

        setPickedZoneGroup(parseInt(targetZone));
    }

    function deleteZone(targetZone) {
        const newZoneGroup = [...zoneGroup];

        setPickedZoneGroup(null);

        config.config.setup.zones = config.config.setup.zones.filter(i => {
            if (i.targetGroupZone !== targetZone) {
                return true;
            }
        });

        config.config.setup.zones.map((zone) => {
            if (zone.targetGroupZone > targetZone) {
                zone.targetGroupZone--;
            }
        })

        newZoneGroup.splice(targetZone, 1);
        setZoneGroup(newZoneGroup);

        //makeZoneGroup();

        ajustArrayColorAndName(targetZone);
        updateConfig();
    }

    function handleDeleteZone(e) {
        const targetZone = parseInt(e.target.dataset.targetZoneD);

        deleteZone(targetZone)
    }

    function ajustArrayColorAndName(targetZone) {
        const newZoneGroupColor = {};
        const newZoneGroupName = {};

        delete newZoneGroupName[targetZone];
        delete newZoneGroupColor[newZoneGroupColor];


        Object.keys(zoneGroupColor).map((groupColor) => {
            const colorId = parseInt(groupColor);
            if (targetZone !== colorId) {
                if (colorId < targetZone) {
                    newZoneGroupColor[colorId] = zoneGroupColor[colorId];
                } else {
                    newZoneGroupColor[colorId - 1] = zoneGroupColor[colorId];
                }
            }
        });

        Object.keys(zoneGroupName).map((groupName) => {
            const nameId = parseInt(groupName);
            if (targetZone !== nameId) {
                if (nameId < targetZone) {
                    newZoneGroupName[nameId] = zoneGroupName[nameId];
                } else {
                    newZoneGroupName[nameId - 1] = zoneGroupName[nameId];
                }
            }
        });

        setZoneGroupColor(newZoneGroupColor);
        setZoneGroupName(newZoneGroupName);
    }

    function handleChangeNameGroupZone(targetIndex, newNameZone, targetGroupZone) {
        setZoneGroupName({...zoneGroupName, [targetIndex]: newNameZone});

        if (targetGroupZone.length !== 0) {
            changeZoneConfig(targetGroupZone, 'name', newNameZone);
        }
    }

    function handleChangeColorGroupZone(targetIndex, newColorZone, targetGroupZone) {
        setZoneGroupColor({...zoneGroupColor, [targetIndex]: newColorZone});
        setLastColorAdded(newColorZone);

        if (targetGroupZone.length !== 0) {
            changeZoneConfig(targetGroupZone, 'color', newColorZone);
        }
        generateMap();
    }

    function handleCellPicked(zoneList, targetZone, params, isSelected) {
        const targetRect = zoneList[targetZone];
        const targetX = Math.floor(targetRect.x / GameConfig.sizeCellGrid);
        const targetY = Math.floor(targetRect.y / GameConfig.sizeCellGrid);


        console.log(haveExistingCase(config.config.setup.zones, targetX, targetY))
        if(haveExistingCase(config.config.setup.zones, targetX, targetY, pickedZoneGroup))
            return false;

        const newGroupZone = [...zoneGroup];

        if (isSelected) {
            const targetColor = zoneGroupColor[pickedZoneGroup];

            const targetNewZoneId = config.config.createZone(targetX, targetY, targetColor, zoneGroupName[pickedZoneGroup], pickedZoneGroup);
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

    function isClickOnGridZone(zoneList, targetZone) {
        const targetRect = zoneList[targetZone];
        const maxTargetX = (config.config.setup.width - 2) * GameConfig.sizeCellGrid + GameConfig.basePosition + 1;
        const maxTargetY = (config.config.setup.height - 2) * GameConfig.sizeCellGrid + GameConfig.basePosition + 1;
        const minTargetX = (1) * GameConfig.sizeCellGrid + GameConfig.basePosition + 1;
        const minTargetY = (1) * GameConfig.sizeCellGrid + GameConfig.basePosition + 1;


        if (targetRect.x > maxTargetX || targetRect.y > maxTargetY
            || targetRect.x < minTargetY || targetRect.y < minTargetY)
            return false;

        return true;
    }

    function saveStep(e, isManual = false) {
        const targetNav = isManual ? e : parseInt(e.target.dataset.targetNav);

        if (targetNav === 5 || targetNav === 4 || targetNav === 3) {
            setTargetLevelConfig(null);
        }

        if (targetNav === 3) {
            //config.config.setup.lots = [];
            setTargetLevelConfig(null);
        }

        if (targetNav === 4) {
            if (isLevelNeedEdit) {
                config.config.cleanAllLot();

                for (let i = 0; i < config.config.setup.gainLevelAmount; i++) {
                    config.config.createLot(true, i + 1, 14, 25, 3, []);
                }

                for (let i = 0; i < config.config.setup.threatLevelAmount; i++) {
                    config.config.createLot(false, i + 1, 14, 25, 3, []);
                }

                setIsLevelNeedEdit(false)
            }
        }

        if (targetNav === 5) {
            setTargetLevelConfig(null);
        }

        setConfigStep(targetNav);
    }

    function getZoneFromId(zoneList) {
        return config.config.setup.zones.find(i => zoneList.indexOf(i.id) > -1);
    }

    function getZoneAttributFromGroup(targetZones, targetKey) {
        if (zoneGroup.length === 0) return 'Pas de zone';

        const firstZoneType = getZoneFromId(targetZones);

        if (targetKey === 'empty') {
            return (1 - (firstZoneType.percentWin + firstZoneType.percentLoose)) * 100;
        }

        if (targetKey === 'win') {
            return firstZoneType.percentWin;
        }

        if (targetKey === 'loose') {
            return firstZoneType.percentLoose;
        }

        if (targetKey === 'isVisible') {
            return firstZoneType.isVisible
        }

        if (targetKey === 'name') {
            return firstZoneType.name
        }
    }

    function around2Decimales(value) {
        return Math.round(value * 100) / 100
    }

    function changeZoneConfig(targetZoneGroup, key, value) {
        const targetZoneObj = config.config.setup.zones.find(
            (i) => i.id === targetZoneGroup[0]
        );
        if (!targetZoneObj) return;

        const targetIdZoneGroup = targetZoneObj.targetGroupZone;

        // Éventuellement, refuser les valeurs négatives
        if (parseFloat(value) < 0) return;

        let isBadConfigZone = false;
        config.config.setup.zones.forEach((item) => {
            if (item.targetGroupZone === targetIdZoneGroup) {
                if (key === 'percentWin' || key === 'percentLoose') {
                    const floatVal = parseFloat(value);
                    if (!isNaN(floatVal)) {
                        // Stockage en fraction
                        item[key] = floatVal / 100;
                        // Par exemple 40.6 => 0.406
                    } else {
                        item[key] = 0;
                    }

                    // Contrôle si la somme dépasse 1
                    if (item.percentWin + item.percentLoose > 1) {
                        isBadConfigZone = true;
                    }
                } else {
                    // Autres clés (isVisible, name, etc.)
                    item[key] = value;
                }
            }
        });

        setPageZoneConfigError(isBadConfigZone);
        updateConfig();
    }


    function changeGlobalConfig(key, value, isNumber = false) {
        if (key === 'gainLevelAmount' || key === 'threatLevelAmount') {
            setIsLevelNeedEdit(true);
        }

        if (isNumber) {
            if (isNaN(value)) {
                console.error('Input value is not a number for', key);
            }
            value = parseInt(value);
        }

        let oldValueDrawType;
        if (key === 'drawTypeGain' || key === 'drawTypeThreat') {
            oldValueDrawType = (key === 'drawTypeGain') ? config.config.setup.drawTypeGain : config.config.setup.drawTypeThreat;
        }

        if(key === "initPositionX" || key === "initPositionY") {
            let currentAxis = (key === "initPositionX") ? 'width' : 'height';
            if(config.config.setup[currentAxis] <= value + 1 || value < 1) {
                config.config.setup[key] = 1;
                updateConfig();
                return;
            }
        }

        config.config.setup[key] = value;


        if ((key === 'drawTypeGain' && value === 'semi-random' && 'semi-random' !== oldValueDrawType) || (key === 'gainLevelAmount'
            && 'semi-random' === config.config.setup.drawTypeGain)) {
            settingRandomDraw(true);
        }

        if ((key === 'drawTypeThreat' && value === 'semi-random' && 'semi-random' !== oldValueDrawType) || (key === 'threatLevelAmount'
            && 'semi-random' === config.config.setup.drawTypeThreat)) {
            settingRandomDraw(false);
        }
        


        updateConfig();
    }

    function settingRandomDraw(isGain = true) {
        if (isGain) {
            config.config.setup.lotWinConfig.randomAmount.exploration = [];
            config.config.setup.lotWinConfig.randomAmount.exploitation = [];

            for (let i = 0; i < config.config.setup.gainLevelAmount; i++) {
                config.config.setup.lotWinConfig.randomAmount.exploration.push(0);
                config.config.setup.lotWinConfig.randomAmount.exploitation.push(0);
            }
        } else {
            config.config.setup.lotLooseConfig.randomAmount.exploration = [];
            config.config.setup.lotLooseConfig.randomAmount.exploitation = [];

            for (let i = 0; i < config.config.setup.threatLevelAmount; i++) {
                config.config.setup.lotLooseConfig.randomAmount.exploration.push(0);
                config.config.setup.lotLooseConfig.randomAmount.exploitation.push(0);
            }
        }
    }

    function changeRandomDrawAmount(type = 'gain', event, action = 'exploration') {
        const targetDrawIndex = parseInt(event.target.dataset.drawIndex);
        let targetValue = isNaN(parseInt(event.target.value)) ? 0 : parseInt(event.target.value);

        const targetTypeLot = [type === 'gain' ? 'lotWinConfig' : 'lotLooseConfig']
        const targetRefArray = config.config.setup[targetTypeLot].randomAmount[action];
        targetRefArray[targetDrawIndex] = targetValue;


        // Check if total is >100
        let total = targetRefArray.reduce((c, i) => c += i, 0);

        const typeCurrentDraw = type = 'gain' ? config.config.setup.drawTypeGain : config.config.setup.drawTypeThreat;
        if (total !== 100 && typeCurrentDraw === 'semi-random') {
            setIsErrorDrawAmount(true);
        } else {
            setIsErrorDrawAmount(false)
        }

        if (sameConfigExploit && action === 'exploration') {
            const exploitConfig = config.config.setup[targetTypeLot].randomAmount['exploitation'];
            exploitConfig[targetDrawIndex] = targetValue;
        }


        updateConfig();
    }

    function settingLevelConfigLot(targetIdExplo, simpleIndex) {
        setTargetLevelConfig(targetIdExplo);
        setSimpleIndexLevelPicked(simpleIndex);
    }

    function changeLotConfig(key, value, typeAction = 'exploration') {
        const targetLotIndex = config.config.setup.lots.findIndex(i => i[typeAction].id === targetLevelConfig);

        if (['maxDraw', 'earnPointMin', 'earnPointMax'].indexOf(key) > -1) {
            value = parseInt(value);
        }

        if (!isNaN(value) && value === '') {
            value = 0;
        }

        config.config.setup.lots[targetLotIndex][typeAction][key] = value;

        if (sameConfigExploit && typeAction === 'exploration') {
            changeLotConfig(key, value, 'exploitation');
        }

        updateConfig();
    }

    function isLotContainZone(targetGroupeZoneIndex, typeAction = 'exploration') {
        const targetLotApplyZone = config.config.setup.lots.find(i => i[typeAction].id === targetLevelConfig)[typeAction].applyZones;

        return targetLotApplyZone.filter(item => zoneGroup[targetGroupeZoneIndex].indexOf(item) > -1).length > 0;
    }

    function zoneApplyChange(targetGroupeZoneIndex, typeAction = 'exploration') {
        let targetLotApplyZone = config.config.setup.lots.find(i => i[typeAction].id === targetLevelConfig)[typeAction].applyZones;

        if (isLotContainZone(targetGroupeZoneIndex, typeAction)) {
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

        if (sameConfigExploit && typeAction === 'exploration') {
            zoneApplyChange(targetGroupeZoneIndex, 'exploitation');
        }

        updateConfig();
    }


    function saveMap() {
        saveConfigSever(!!params.id).then(res => res.json()).then((data) => {
            const newConfig = new GameConfig();
            newConfig.setup = data;
            newConfig._id = data._id;
            setGlobalConfig({list: [...globalConfig.list, config.config], config: newConfig});
            navigate('/edit-session/' + data._id);
        }).catch((error) => console.error(error));
    }

    function saveConfigSever(isUpdate = false) {
        const dataConfig = {...config.config.setup};
        delete dataConfig.id;

        if (isUpdate) {
            return Requester.post('/api/gameconfig/' + dataConfig._id, dataConfig);
        } else {
            return Requester.post('/api/gameconfig/', dataConfig);
        }
    }


    return (
        <div>
            <div className="page-container">
                <div className="d-flex justify-content-between align-items-center">
                    <Link to="/" className="btn btn-primary mx-2">
                        <i className="fa-solid fa-bars mx-2"/>
                        Menu
                    </Link>

                    <h1 className="text-center mx-4">New experience (step <b>{configStep}</b>)</h1>
                </div>

                {configStep && (
                    <ControllerConfigPanel isEditConfig={!!params.id} configPart={1} configStep={configStep} currentConfig={config}
                                       saveStep={saveStep} saveMap={saveMap}/>
                )}
            </div>

            <div>
                {configStep === 1 && (
                    <div className="container">

                        {isConfirmGenerateMap && (
                            <div className="row">
                                <div className="col-12">
                                    <div className="popin-container">
                                        <div className="popin-content">
                                            <span className="popin-close"
                                                  onClick={() => setIsConfirmGenerateMap(false)}>
                                                <i className="fa-solid fa-xmark"></i>
                                            </span>

                                            <div className="d-flex flex-column">
                                                <p>Do you want generate map ?</p>

                                                <div className="d-flex justify-content-end">
                                                    <button className="btn btn-sm btn-primary mx-4"
                                                            onClick={() => generateMap(true)}>
                                                        <i className="fa-solid fa-check mx-2"></i>
                                                        OK
                                                    </button>

                                                    <button className="btn btn-sm btn-danger"
                                                            onClick={() => setIsConfirmGenerateMap(false)}>
                                                        <i className="fa-solid fa-xmark mx-2"></i>
                                                        Cancel
                                                    </button>
                                                </div>

                                                {
                                                    (isMapDisplay || params.id) && (
                                                        <div>
                                                            <p className="alert alert-warning mt-2">
                                                                Regenerate map delete all current zones </p>
                                                        </div>
                                                    )
                                                }

                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                        <div className="row">
                            <div className="col-4 my-2">
                                <h2 className="text-center">Map configuration</h2>
                            </div>

                            <div className="col-8">
                                <div>
                                    <fieldset className="d-flex flex-column mb-2">
                                        <div className="">
                                            <input type="text" className="form-control" placeholder="Experience name"
                                                   value={config.config.setup.name} onChange={(e) => {
                                                changeGlobalConfig('name', e.target.value)
                                            }}/>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>


                            <div className="col-4">
                                <div className="">
                                    <fieldset className="mb-2">
                                        <h3>Map size</h3>

                                        <div className="d-flex align-items-center">
                                            <span>W</span>
                                            <NumericInput className="form-control mx-2" placeholder="Width" allowDecimal={false}
                                                   onChange={(e) => setSizeMap('width', e.target.value)}
                                                   value={config.config.setup.width - 2}/>

                                            <span>H</span>
                                            <NumericInput className="form-control mx-2" placeholder="Height"
                                                   onChange={(e) => setSizeMap('height', e.target.value)}
                                                   value={config.config.setup.height - 2}/>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>


                            <div className="col-8">
                                <div className="">
                                    <fieldset>
                                        <h3>Start position</h3>

                                        <div className="d-flex align-items-center">
                                            <span>W</span>
                                            <NumericInput className="form-control mx-2" placeholder="x"
                                                   value={config.config.setup.initPositionX} onChange={(e) => {
                                                changeGlobalConfig('initPositionX', e.target.value, true)
                                            }}/>

                                            <span>H</span>
                                            <NumericInput className="form-control mx-2" placeholder="y"
                                                   value={config.config.setup.initPositionY} onChange={(e) => {
                                                changeGlobalConfig('initPositionY', e.target.value, true)
                                            }}/>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>

                            {isMapDisplay && (
                                <div className="col-4">
                                    <fieldset>
                                        <h3>
                                            Zones <br/>
                                        </h3>

                                        <div className="d-flex align-items-center">
                                            <button className="btn btn-sm btn-success mx-2 my-2"
                                                    onClick={addGroupeZone}>
                                                <i className="fa-solid fa-plus"/> Create
                                            </button>

                                            {/*<label className="d-flex align-items-center">
                                            select color zone
                                            <input className="mx-2" type="color" value={colorSelect}
                                                   onChange={(e) => {
                                                       setColorSelect(e.target.value)
                                                   }}/>
                                        </label>*/}
                                        </div>

                                        {zoneGroup.length === 0 && (
                                            <p className="alert alert-warning position-static">
                                                Need 1 zone minimum </p>
                                        )}

                                        <div className="zones-container">
                                            {zoneGroup.map((item, currentIndex) => (
                                                <div
                                                    className={"zones-row " + ((pickedZoneGroup === currentIndex) ? 'zone-selected' : '')}
                                                    key={currentIndex}>
                                                    <div className="d-flex align-items-center my-2 position-relative">
                                                        {
                                                            currentIndex !== pickedZoneGroup && (
                                                                <div className="select-zone-overlay" onClick={selectZone}
                                                                     data-target-zone={currentIndex}></div>
                                                            )
                                                        }


                                                        <div>
                                                            <input className="form-control" type="text"
                                                                   value={zoneGroupName[currentIndex]} onChange={(e) =>
                                                                handleChangeNameGroupZone(currentIndex, e.target.value, item)}/>

                                                        </div>

                                                        <div>
                                                            <input className="mx-2" type="color"
                                                                   value={zoneGroupColor[currentIndex]} onChange={(e) =>
                                                                handleChangeColorGroupZone(currentIndex, e.target.value, item)}/>
                                                        </div>

                                                        <div>
                                                            <button className="btn-sm btn-danger mx-2"
                                                                    onClick={handleDeleteZone}
                                                                    data-target-zone-d={currentIndex}>
                                                                <i className="fa-solid fa-trash mx-1"/>
                                                                delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </fieldset>
                                </div>
                            )}

                            <div className="col-8">
                                <div className="d-flex justify-content-center">
                                    {/*<div>
                                        <button className="btn btn-success"
                                                onClick={() => setIsConfirmGenerateMap(true)}>
                                            <i className="fa-solid fa-recycle mx-2"></i> Generate map
                                        </button>
                                    </div>*/}

                                    {
                                        errorMapGenerate && (
                                            <div>
                                                <p className="alert alert-danger mx-2">Impossible de générer la map avec la
                                                    configuration actuelle</p>
                                            </div>
                                        )
                                    }
                                </div>
                                <div className="grid-editor-container">
                                    {
                                        isMapDisplay && (
                                            <Map modeEditor={true} config={config} handleCellPicked={handleCellPicked}
                                                 targetGroupZone={pickedZoneGroup} zoneGroup={zoneGroup}
                                                 isClickOnGridZone={isClickOnGridZone} ref={mapRef}/>
                                        )
                                    }
                                </div>

                                {!isConfirmGenerateMap && (
                                    <div className="d-flex justify-content-end mb-2">
                                        <button type="button" onClick={saveStep} data-target-nav={2}
                                                disabled={getValidConfigStep1()} className="btn btn-primary">
                                            <i className="fa-solid fa-arrow-right mx-2" data-target-nav={2}/>Save map /
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div>
                {configStep === 2 && (
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
                                            <th>% Empty zone</th>
                                            <th>% Gain zone</th>
                                            <th>% Threat zone</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {zoneGroup.map((currentZoneGroup, currentIndex) => (
                                            <tr key={currentIndex}>
                                                <th>{getZoneAttributFromGroup(currentZoneGroup, 'name')}</th>
                                                <td>
                                                    {!getZoneAttributFromGroup(currentZoneGroup, 'isVisible') && (
                                                        <i className="fa-solid fa-square"
                                                           onClick={() => changeZoneConfig(currentZoneGroup, 'isVisible', true)}/>
                                                    )}

                                                    {getZoneAttributFromGroup(currentZoneGroup, 'isVisible') && (
                                                        <i className="fa-solid fa-square-check"
                                                           onClick={() => changeZoneConfig(currentZoneGroup, 'isVisible', false)}/>
                                                    )}
                                                </td>
                                                <td>{getZoneAttributFromGroup(currentZoneGroup, 'empty')}%</td>
                                                <td>
                                                    <NumericInput type="text" className="form-control" allowDecimal
                                                           onChange={(e) => changeZoneConfig(currentZoneGroup, 'percentWin', e.target.value, true)}
                                                           value={getZoneAttributFromGroup(currentZoneGroup, 'win') * 100}/>
                                                </td>
                                                <td>
                                                    <NumericInput type="text" className="form-control" allowDecimal
                                                           onChange={(e) => changeZoneConfig(currentZoneGroup, 'percentLoose', e.target.value, true)}
                                                           value={getZoneAttributFromGroup(currentZoneGroup, 'loose') * 100}/>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {
                                    pageZoneConfigError && (
                                        <p className="alert alert-danger">
                                            La configuration des zones est mauvaise. </p>
                                    )
                                }

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
                                            disabled={pageZoneConfigError} className="btn btn-primary">
                                        <i className="fa-solid fa-arrow-right mx-2" data-target-nav={3}/>Save map / Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {configStep === 3 && (
                <div className="container">
                    <div className="row">
                        <div className="col-12 my-3 text-center">
                            <h2 className="text-center">Points configuration</h2>
                        </div>

                        <div className="col-4 config-split-main-container">
                            <h3 className="text-center my-2">Global configuration</h3>

                            <div>
                                <label className="my-2">
                                    Total player actions
                                    <NumericInput className="form-control"
                                           value={config.config.setup.roundLeftMax} onChange={(e) => {
                                        changeGlobalConfig('roundLeftMax', e.target.value, true)
                                    }}/>
                                </label>

                                <label className="my-2">
                                    Initial player score
                                    <NumericInput className="form-control" value={config.config.setup.startPoint}
                                           onChange={(e) => {
                                               changeGlobalConfig('startPoint', e.target.value, true)
                                           }}/>
                                </label>

                                <label className="my-2">
                                    Amount of gain level
                                    <NumericInput className="form-control"
                                           value={config.config.setup.gainLevelAmount} onChange={(e) => {
                                        changeGlobalConfig('gainLevelAmount', e.target.value, true)
                                    }}/>
                                </label>

                                <label className="my-2">
                                    Amount of threat level
                                    <NumericInput className="form-control"
                                           value={config.config.setup.threatLevelAmount} onChange={(e) => {
                                        changeGlobalConfig('threatLevelAmount', e.target.value, true)
                                    }}/>
                                </label>

                                <label className="my-2">
                                    Try amount by session
                                    <NumericInput className="form-control" value={config.config.setup.tryAmount}
                                           onChange={(e) => {
                                               changeGlobalConfig('tryAmount', e.target.value, true)
                                           }}/>
                                </label>
                            </div>
                        </div>

                        <div className="col-4 config-split-main-container">
                            <h3 className="text-center mt-2 mb-5">Gain logic between level</h3>
                            <div className="select-setup-container">
                                <div
                                    className={"select-setup" + (config.config.setup.drawTypeGain === 'sequential' ? ' draw-active' : '')}
                                    onClick={() => {
                                        changeGlobalConfig('drawTypeGain', 'sequential')
                                    }}>
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeGain !== 'sequential' ? ' d-none' : '')}/>
                                        Sequential draw </p>
                                </div>

                                <div
                                    className={"select-setup" + (config.config.setup.drawTypeGain === 'random' ? ' draw-active' : '')}
                                    onClick={() => {
                                        changeGlobalConfig('drawTypeGain', 'random')
                                    }}>
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeGain !== 'random' ? ' d-none' : '')}/>
                                        Random draw </p>
                                </div>

                                <div
                                    className={"select-setup" + (config.config.setup.drawTypeGain === 'semi-random' ? ' draw-active' : '')}
                                    onClick={() => {
                                        changeGlobalConfig('drawTypeGain', 'semi-random');
                                    }}>
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeGain !== 'semi-random' ? ' d-none' : '')}/>
                                        Semi-random draw </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-4 config-split-main-container">
                            <h3 className="text-center mt-2 mb-5">Threat logic between level</h3>

                            <div className="select-setup-container">
                                <div
                                    className={"select-setup" + (config.config.setup.drawTypeThreat === 'sequential' ? ' draw-active' : '')}
                                    onClick={() => {
                                        changeGlobalConfig('drawTypeThreat', 'sequential')
                                    }}>
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeThreat !== 'sequential' ? ' d-none' : '')}/>
                                        Sequential draw </p>
                                </div>

                                <div
                                    className={"select-setup" + (config.config.setup.drawTypeThreat === 'random' ? ' draw-active' : '')}
                                    onClick={() => {
                                        changeGlobalConfig('drawTypeThreat', 'random')
                                    }}>
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeThreat !== 'random' ? ' d-none' : '')}/>
                                        Random draw </p>
                                </div>

                                <div
                                    className={"select-setup" + (config.config.setup.drawTypeThreat === 'semi-random' ? ' draw-active' : '')}
                                    onClick={() => {
                                        changeGlobalConfig('drawTypeThreat', 'semi-random')
                                    }}>
                                    <p>
                                        <i className={"fa-solid fa-check mx-2 checked-style" +
                                            (config.config.setup.drawTypeThreat !== 'semi-random' ? ' d-none' : '')}/>
                                        Semi-random draw </p>
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

            {configStep === 4 && (
                <div className="container">
                    <div className="row">
                        <div className="col-12 my-3 text-center">
                            <h2 className="text-center">Gain category setup</h2>
                        </div>

                        <div className="col-4 config-split-main-container">
                            <h3 className="text-center mt-2 mb-5">Levels picking</h3>

                            <div className="select-setup-container">
                                {config.config.setup.lots.filter(i => i.exploration.isWin).map((currentLot, index) => (
                                    <div
                                        className={"select-setup" + (targetLevelConfig === currentLot.exploration.id ? ' draw-active' : '')}
                                        key={currentLot.exploration.id}
                                        onClick={(e) => settingLevelConfigLot(currentLot.exploration.id, index)}>
                                        <p>
                                            Level {index}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {
                                isErrorDrawAmount && (
                                    <div className="col-12">
                                        <p className="alert alert-danger">
                                            Config Error : Drawamount is not equal to 100 </p>
                                    </div>
                                )
                            }
                        </div>

                        {targetLevelConfig !== null && (
                            <div className="col-4 config-split-main-container">
                                <h3 className="text-center mt-2 mb-5">Exploration</h3>

                                <div>
                                    <label className="d-flex my-2 align-content-center align-items-center">
                                        Points interval
                                        <NumericInput className="form-control mx-1" placeholder="From"
                                               value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.earnPointMin}
                                               onChange={(e) => changeLotConfig('earnPointMin', e.target.value, 'exploration')}/>
                                        <span className="mx-1">to</span>
                                        <NumericInput className="form-control mx-1" placeholder="to"
                                               value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.earnPointMax}
                                               onChange={(e) => changeLotConfig('earnPointMax', e.target.value, 'exploration')}/>
                                    </label>
                                </div>

                                {config.config.setup.drawTypeGain === 'sequential' && (
                                    <label className="my-2">
                                        Max draw
                                        <NumericInput className="form-control mx-1" placeholder="Max draw"
                                               value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.maxDraw}
                                               onChange={(e) => changeLotConfig('maxDraw', e.target.value, 'exploration')}/>
                                    </label>
                                )}

                                {config.config.setup.drawTypeGain === 'semi-random' && (
                                    <label className="my-2">
                                        Draw amount %
                                        <NumericInput className="form-control"
                                               value={config.config.setup.lotWinConfig.randomAmount['exploration'][simpleIndexLevelPicked]}
                                               data-draw-index={simpleIndexLevelPicked}
                                               onChange={(e) => changeRandomDrawAmount('gain', e, 'exploration')}/>
                                    </label>
                                )}


                                <label className="my-2">
                                    Zones apply
                                    {zoneGroup.map((item, index) => (
                                        <div key={index}>
                                            {!isLotContainZone(index, 'exploration') && (
                                                <p>
                                                    <i className="fa-solid fa-square mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploration')}/>
                                                    {getZoneAttributFromGroup(item, 'name')}
                                                </p>
                                            )}

                                            {isLotContainZone(index, 'exploration') && (
                                                <p>
                                                    <i className="fa-solid fa-square-check mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploration')}/>
                                                    {getZoneAttributFromGroup(item, 'name')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </label>
                            </div>
                        )}

                        {targetLevelConfig !== null && (
                            <div className="col-4 config-split-main-container">
                                <h3 className="text-center mt-2 mb-5">Exploitation</h3>

                                <label onClick={() => {
                                    setSameConfigExploit(!sameConfigExploit)
                                }}>
                                    Same config for exploitation
                                    <i className={'fa-solid mx-2 checkbox fa-' + (sameConfigExploit ? 'square-check' : 'square')}></i>
                                </label>

                                <div>
                                    <label className="d-flex my-2 align-content-center align-items-center">
                                        Points interval
                                        <NumericInput className="form-control mx-1" placeholder="From"
                                               value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.earnPointMin}
                                               onChange={(e) => changeLotConfig('earnPointMin', e.target.value, 'exploitation')}/>
                                        <span className="mx-1">to</span>
                                        <NumericInput className="form-control mx-1" placeholder="to"
                                            /*value={config.config.setup.lots.[targetLevelConfig].exploitation.earnPointMax}*/
                                               value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.earnPointMax}
                                               onChange={(e) => changeLotConfig('earnPointMax', e.target.value, 'exploitation')}/>
                                    </label>
                                </div>

                                {config.config.setup.drawTypeGain === 'sequential' && (
                                    <label className="my-2">
                                        Max draw
                                        <NumericInput className="form-control mx-1" placeholder="Max draw"
                                               value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.maxDraw}
                                               onChange={(e) => changeLotConfig('maxDraw', e.target.value, 'exploitation')}/>
                                    </label>
                                )}

                                {config.config.setup.drawTypeGain === 'semi-random' && (
                                    <label className="my-2">
                                        Draw amount %
                                        <NumericInput className="form-control"
                                               value={config.config.setup.lotWinConfig.randomAmount['exploitation'][simpleIndexLevelPicked]}
                                               data-draw-index={simpleIndexLevelPicked}
                                               onChange={(e) => changeRandomDrawAmount('gain', e, 'exploitation')}/>
                                    </label>
                                )}

                                <label className="my-2">
                                    {zoneGroup.map((item, index) => (
                                        <div key={index}>
                                            {!isLotContainZone(index, 'exploitation') && (
                                                <p>
                                                    <i className="fa-solid fa-square mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploitation')}/>
                                                    {getZoneAttributFromGroup(item, 'name')}
                                                </p>
                                            )}

                                            {isLotContainZone(index, 'exploitation') && (
                                                <p>
                                                    <i className="fa-solid fa-square-check mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploitation')}/>
                                                    {getZoneAttributFromGroup(item, 'name')}
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
                                        disabled={isErrorDrawAmount} className="btn btn-primary">
                                    <i className="fa-solid fa-arrow-right mx-2" data-target-nav={5}/>
                                    Save map / Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {configStep === 5 && (
                <div className="container">
                    <div className="row">
                        <div className="col-12 my-3 text-center">
                            <h2 className="text-center">Threat category setup</h2>
                        </div>

                        <div className="col-4 config-split-main-container">
                            <h3 className="text-center mt-2 mb-5">Levels picking</h3>

                            <div className="select-setup-container">
                                {config.config.setup.lots.filter(i => !i.exploration.isWin).map((currentLot, index) => (
                                    <div
                                        className={"select-setup" + (targetLevelConfig === currentLot.exploration.id ? ' draw-active' : '')}
                                        key={currentLot.exploration.id}
                                        onClick={(e) => settingLevelConfigLot(currentLot.exploration.id, index)}>
                                        <p>
                                            Level {index}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {
                                isErrorDrawAmount && (
                                    <div className="col-12">
                                        <p className="alert alert-danger">
                                            Config Error : Drawamount is not equal to 100 </p>
                                    </div>
                                )
                            }
                        </div>

                        {targetLevelConfig !== null && (
                            <div className="col-4 config-split-main-container">
                                <h3 className="text-center mt-2 mb-5">Exploration</h3>

                                <div>
                                    <label className="d-flex my-2 align-content-center align-items-center">
                                        Points interval
                                        <NumericInput className="form-control mx-1" placeholder="From"
                                               value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.earnPointMin}
                                               onChange={(e) => changeLotConfig('earnPointMin', e.target.value, 'exploration')}/>
                                        <span className="mx-1">to</span>
                                        <NumericInput className="form-control mx-1" placeholder="to"
                                               value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.earnPointMax}
                                               onChange={(e) => changeLotConfig('earnPointMax', e.target.value, 'exploration')}/>
                                    </label>
                                </div>

                                {config.config.setup.drawTypeThreat === 'sequential' && (
                                    <label className="my-2">
                                        Max draw
                                        <NumericInput className="form-control mx-1" placeholder="Max draw"
                                               value={config.config.setup.lots.find(i => i.exploration.id === targetLevelConfig).exploration.maxDraw}
                                               onChange={(e) => changeLotConfig('maxDraw', e.target.value, 'exploration')}/>
                                    </label>
                                )}

                                {config.config.setup.drawTypeThreat === 'semi-random' && (
                                    <label className="my-2">
                                        Draw amount %
                                        <NumericInput className="form-control"
                                               value={config.config.setup.lotLooseConfig.randomAmount['exploration'][simpleIndexLevelPicked]}
                                               data-draw-index={simpleIndexLevelPicked}
                                               onChange={(e) => changeRandomDrawAmount('threat', e, 'exploration')}/>
                                    </label>
                                )}


                                <label className="my-2">
                                    Zones apply
                                    {zoneGroup.map((item, index) => (
                                        <div key={index}>
                                            {!isLotContainZone(index, 'exploration') && (
                                                <p>
                                                    <i className="fa-solid fa-square mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploration')}/>
                                                    {getZoneAttributFromGroup(item, 'name')}
                                                </p>
                                            )}

                                            {isLotContainZone(index, 'exploration') && (
                                                <p>
                                                    <i className="fa-solid fa-square-check mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploration')}/>
                                                    {getZoneAttributFromGroup(item, 'name')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </label>
                            </div>
                        )}

                        {targetLevelConfig !== null && (
                            <div className="col-4 config-split-main-container">
                                <h3 className="text-center mt-2 mb-5">Exploitation</h3>

                                <label onClick={() => {
                                    setSameConfigExploit(!sameConfigExploit)
                                }}>
                                    Même configuration pour l'exploitation
                                    <i className={'fa-solid mx-2 checkbox fa-' + (sameConfigExploit ? 'square-check' : 'square')}></i>
                                </label>

                                <div>
                                    <label className="d-flex my-2 align-content-center align-items-center">
                                        Points interval
                                        <NumericInput className="form-control mx-1" placeholder="From"
                                               value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.earnPointMin}
                                               onChange={(e) => changeLotConfig('earnPointMin', e.target.value, 'exploitation')}/>
                                        <span className="mx-1">to</span>
                                        <NumericInput className="form-control mx-1" placeholder="to"
                                               value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.earnPointMax}
                                               onChange={(e) => changeLotConfig('earnPointMax', e.target.value, 'exploitation')}/>
                                    </label>
                                </div>

                                {config.config.setup.drawTypeThreat === 'sequential' && (
                                    <label className="my-2">
                                        Max draw
                                        <NumericInput className="form-control mx-1" placeholder="Max draw"
                                               value={config.config.setup.lots.find(i => i.exploitation.id === targetLevelConfig).exploitation.maxDraw}
                                               onChange={(e) => changeLotConfig('maxDraw', e.target.value, 'exploitation')}/>
                                    </label>
                                )}

                                {config.config.setup.drawTypeThreat === 'semi-random' && (
                                    <label className="my-2">
                                        Draw amount %
                                        <NumericInput className="form-control"
                                               value={config.config.setup.lotLooseConfig.randomAmount['exploitation'][simpleIndexLevelPicked]}
                                               data-draw-index={simpleIndexLevelPicked}
                                               onChange={(e) => changeRandomDrawAmount('threat', e, 'exploitation')}/>
                                    </label>
                                )}

                                <label className="my-2">
                                    Zones apply
                                    {zoneGroup.map((item, index) => (
                                        <div key={index}>
                                            {!isLotContainZone(index, 'exploitation') && (
                                                <p>
                                                    <i className="fa-solid fa-square mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploitation')}/>
                                                    {getZoneAttributFromGroup(item, 'name')}
                                                </p>
                                            )}

                                            {isLotContainZone(index, 'exploitation') && (
                                                <p>
                                                    <i className="fa-solid fa-square-check mx-2 checkbox"
                                                       onClick={() => zoneApplyChange(index, 'exploitation')}/>
                                                    {getZoneAttributFromGroup(item, 'name')}
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
                                <button type="button" onClick={saveMap} disabled={isErrorDrawAmount}
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

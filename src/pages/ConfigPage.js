import './ConfigPage.css';
import {Map} from "../components/Map";
import {useState} from "react";
import {GameConfig} from "../class/GameConfig";

export default function ConfigPage () {
    const [configStep, setConfigStep] = useState(1);
    const [zoneGroup, setZoneGroup] = useState([]);
    const [config, setConfig] = useState(new GameConfig());
    const [pickedZoneGroup, setPickedZoneGroup] = useState(null);

    function addGroupeZone() {
        setZoneGroup([...zoneGroup, []]);
    }

    function setSizeMap(key, value) {
        value = parseInt(value) + 2;
        setConfig({...config, setup : {...config.setup, [key] : value}});
    }

    function selectZone(e) {
        const targetZone = e.target.dataset.targetZone;

        setPickedZoneGroup(parseInt(targetZone));
    }

    function deleteZone(e) {
        const targetZone = parseInt(e.target.dataset.targetZoneD);
        const configCopy = config

        setPickedZoneGroup(null);
        zoneGroup.map((item) => {
            configCopy.setup.zones.filter(i => i.id === item)
        })
        setConfig(configCopy)
        setZoneGroup(zoneGroup.filter((e, i) => i !== targetZone));
    }

    function handleZonePicked(zoneList, targetZone, params, isSelected) {
        const targetRect = zoneList[targetZone];
        const targetX = Math.floor(targetRect.x / params.sizeGrid);
        const targetY = Math.floor(targetRect.y / params.sizeGrid);




        const targetGroupZone = [...zoneGroup];

        console.log('zoneList', zoneList)
        console.log('targetRect', targetRect)
        console.log('targetZone', targetZone)
        console.log('targetGroupZone', targetGroupZone)
        console.log('targetGroupZone[pickedZoneGroup]', targetGroupZone[pickedZoneGroup]);
        if(isSelected) {
            const targetNewZoneId = config.createZone(targetX, targetY, '#FF00CC');
            targetGroupZone[pickedZoneGroup].push(targetNewZoneId);
        }

        setZoneGroup(targetGroupZone)
    }

    function saveStep1() {
        setConfigStep(2);
    }

    function getZoneFromGroup(indexZone, targetKey) {
        // console.log(indexZone)
        //console.log(zoneGroup)
        if(zoneGroup.length === 0) return 'Pas de zone';

        if(targetKey === 'empty') {
            return Math.abs(zoneGroup[0].percentWin - zoneGroup[1].percentLoose);
        }
    }

    return (
        <div>
            <div className="page-container">
                <h1 className="text-center">New experience</h1>
            </div>

            <div>
                { configStep === 1 && (
                    <div className="container">
                        <div className="row">
                            <div className="col-4 my-3">
                                <h2 className="text-center">Map configuration</h2>
                            </div>

                            <div className="col-8">
                                <div>
                                    <fieldset className="d-flex flex-column mb-2">
                                        <div className="">
                                            <input type="text" className="form-control" placeholder="Experience name"/>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>

                            <div className="col-4">
                                <div className="">
                                    <fieldset className="mb-4">
                                        <h3>Map size</h3>

                                        <input type="number" className="form-control mb-2" placeholder="Width"
                                               onChange={(e) => setSizeMap('width', e.target.value)}
                                               value={config.setup.width - 2}/>

                                        <input type="number" className="form-control" placeholder="Height"
                                               onChange={(e) => setSizeMap('height', e.target.value)}
                                               value={config.setup.height - 2}/>
                                    </fieldset>
                                </div>
                            </div>

                            <div className="col-8">
                                <div className="">
                                    <fieldset>
                                        <h3>Start position</h3>

                                        <input type="number" className="form-control mb-2" placeholder="x"/>

                                        <input type="number" className="form-control" placeholder="y"/>
                                    </fieldset>
                                </div>
                            </div>

                            <div className="col-4">
                                <fieldset>
                                    <h3>
                                        Zones <br/>

                                        <button className="btn btn-sm btn-success mx-2 my-2" onClick={addGroupeZone}>
                                            <i className="fa-solid fa-plus"/> Ajouter
                                        </button>
                                    </h3>

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
                                    <button type="button" onClick={saveStep1}
                                            className="btn btn-primary">Save map / Next</button>
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
                                            <td><i className="fa-solid fa-square"></i></td>
                                            <td>{ getZoneFromGroup(currentIndex, 'empty')}</td>
                                            <td>5</td>
                                            <td>5</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

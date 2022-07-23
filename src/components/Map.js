import React, {useCallback, useContext, useEffect, useRef, useState} from "react";
import {GameManager} from "../class/GameManager";
import playerPicture from '../assets/images/character-svgrepo-com.svg'
import {GameConfig} from "../class/GameConfig";
import {ConfigContext} from "../utils/ConfigContext";

// context.arc(50, 100, 20, 0, 2*Math.PI)

export function Map(props) {
    const canvasRef = useRef(null);
    const setupConfig = props.config.config.setup;

    const params = {
        sizeGrid: 35,
        basePosition: 10,
        screen: {
            h: window.innerHeight,
            w: window.innerWidth,
        }
    }
    const [listRect, setListRect] = useState(initDataRect());

    const handleMouseClick = useCallback((e) => {
        if (!props.modeEditor) {
            return;
        }

        e = e.nativeEvent;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        listRect.forEach((rect, index) => {
            context.beginPath();
            context.rect(rect.x, rect.y, rect.w, rect.h);
            if (context.isPointInPath(e.offsetX, e.offsetY) && props.targetGroupZone !== null
                && rect.x > params.basePosition && rect.y > params.basePosition) {
                context.fillStyle = rect.isSelected ? 'white' : 'red';
                rect.isSelected = !rect.isSelected;
                context.fill();

                props.handleZonePicked(listRect, index, params, rect.isSelected);
            }

            context.closePath();
        });
    }, [props.config, listRect, props.targetGroupZone, props.zoneGroup]);


    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const playerImage = new Image();
        playerImage.onload = () => {
            if (!props.modeEditor) {
                drawPlayer(context, playerImage);
            }
        }
        playerImage.src = playerPicture;


        drawGrid(context);

        if (props.modeEditor) {
            drawZones(context);
        } else {
            drawAllZones(context);
        }

        return () => {
            //canvasRef.current.removeEventListener("click", handleMouseClick);
        }
    }, [props.player, props.config, props.targetGroupZone, props.zoneGroup, listRect]);

    function drawPlayer(context, targetImage) {
        const xStart = (params.basePosition + 1) + (props.player.position.x * params.sizeGrid);
        const yStart = (params.basePosition + 1) + (props.player.position.y * params.sizeGrid);

        context.drawImage(targetImage, xStart + 2, yStart + 2, params.sizeGrid - 6, params.sizeGrid - 6)
    }

    function drawRectTextZone(context, x = 0, y = 0, color = "red", text = 'hello') {
        const xStart = (params.basePosition + 1) + (x * params.sizeGrid);
        const xStartText = text.length === 1 ? (xStart + 11) : xStart + 3;
        const yStart = (params.basePosition + 1) + (y * params.sizeGrid);

        context.fillStyle = color;
        context.rect(xStart, yStart, params.sizeGrid - 2, params.sizeGrid - 2);
        context.fill();

        context.strokeStyle = 'white';
        context.font = '22px sans-serif';
        context.strokeText(text, xStartText, params.basePosition + (y + 1) * params.sizeGrid - 8);
        context.strokeStyle = color;
    }

    function drawGrid(context) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        context.beginPath();
        for (let i = 0; i < setupConfig.width; i++) {
            context.strokeStyle = '#333';
            context.moveTo(params.basePosition + i * params.sizeGrid, params.basePosition)
            context.lineTo(params.basePosition + i * params.sizeGrid, params.basePosition + params.sizeGrid * (setupConfig.height - 1));
            context.stroke();

            for (let j = 0; j !== setupConfig.height; j++) {
                context.beginPath();
                context.strokeStyle = '#333';
                context.moveTo(params.basePosition, params.basePosition + params.sizeGrid * j)
                context.lineTo(params.basePosition + params.sizeGrid * (setupConfig.width - 1), params.basePosition + j * params.sizeGrid);
                context.stroke();

                if ((j === 1 || i === 1) && j < setupConfig.height - 1 && j > 0) {
                    drawRectTextZone(context, 0, j, "#222", j.toString());
                }

                if ((j === 0) && i < setupConfig.width - 1 && i > 0) {
                    drawRectTextZone(context, i, 0, "#222", i.toString());
                }
            }

            context.fill();
        }
    }

    function initDataRect() {
        const targetRect = [];

        for (let i = 0; i < setupConfig.width; i++) {
            for (let j = 0; j !== setupConfig.height; j++) {
                targetRect.push({
                    x: params.basePosition + i * params.sizeGrid + 1,
                    y: params.basePosition + j * params.sizeGrid + 1,
                    w: params.sizeGrid - 2,
                    h: params.sizeGrid - 2,
                    isSelected: false
                });
            }
        }

        return targetRect;
    }

    function drawZones(context) {
        const emptyColor = 'white';

        listRect.map((item) => {
            const xStart = (params.basePosition + 1) + (item.x * params.sizeGrid);
            const yStart = (params.basePosition + 1) + (item.y * params.sizeGrid);

            const targetRectPoint = {
                xStart: xStart,
                yStart: yStart,
                width: params.sizeGrid - 2,
                height: params.sizeGrid - 2,
            }

            context.beginPath();
            context.rect(
                targetRectPoint.xStart,
                targetRectPoint.yStart,
                targetRectPoint.width,
                targetRectPoint.height);

            item.isSelected = false;
            context.fillStyle = emptyColor;
            context.fill();
        });

        setupConfig.zones.forEach((currentZone) => {
            const xStart = (params.basePosition + 1) + (currentZone.x * params.sizeGrid);
            const yStart = (params.basePosition + 1) + (currentZone.y * params.sizeGrid);
            context.beginPath();
            context.fillStyle = currentZone.color;

            if (props.targetGroupZone !== null && currentZone.targetGroupZone !== props.targetGroupZone) {
                return;
            }

            const targetRectPoint = {
                xStart: xStart,
                yStart: yStart,
                width: params.sizeGrid - 2,
                height: params.sizeGrid - 2,
            };

            context.rect(
                targetRectPoint.xStart,
                targetRectPoint.yStart,
                targetRectPoint.width,
                targetRectPoint.height);

            context.fill();

            listRect.map((item) => {
                const targetX = Math.floor(item.x / params.sizeGrid);
                const targetY = Math.floor(item.y / params.sizeGrid);

                if (currentZone.x === targetX && currentZone.y === targetY) {
                    item.isSelected = true;
                }

                return item;
            });
        });
    }

    function drawAllZones(context) {
        setupConfig.zones.forEach((currentZone) => {
            context.beginPath();
            const xStart = (params.basePosition + 1) + (currentZone.x * params.sizeGrid);
            const yStart = (params.basePosition + 1) + (currentZone.y * params.sizeGrid);
            context.fillStyle = currentZone.color;

            const targetRectPoint = {
                xStart: xStart,
                yStart: yStart,
                width: params.sizeGrid - 2,
                height: params.sizeGrid - 2,
            };

            context.rect(
                targetRectPoint.xStart,
                targetRectPoint.yStart,
                targetRectPoint.width,
                targetRectPoint.height);

            context.fill();
        });

        console.log(setupConfig.zones)
    }

    return (
        <div>
            <canvas onClick={handleMouseClick} ref={canvasRef} height={(setupConfig.height * params.sizeGrid)}
                    width={(setupConfig.width * params.sizeGrid)}/>
        </div>
    );
}

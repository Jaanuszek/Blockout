import * as THREE from 'three';
import Scene from './Scene'
import Camera from './camera'


export default class InputManager {
    private keys: { [key: string]: boolean } = {};
    private keysProessed: { [key: string]: boolean } = {};
    private keyDownHandler: (e: KeyboardEvent) => void;
    private keyUpHandler: (e: KeyboardEvent) => void;
    private callbackDict: { [key: string]: () => void } = {};
    private scene: Scene;
    private camera: Camera;
    
    constructor(scene: Scene, camera: Camera) {
        this.scene = scene;
        this.camera = camera;

        this.keyDownHandler = this.onKeyDown.bind(this);
        this.keyUpHandler = this.onKeyUp.bind(this);
        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);
    }

    private onKeyDown(e: KeyboardEvent) {
        this.keys[e.code] = true;
    }
    
    private onKeyUp(e: KeyboardEvent) {
        this.keys[e.code] = false;
        this.keysProessed[e.code] = false;
    }

    public addCallback(key: string, callback: () => void) {
        this.callbackDict[key] = callback;
    }
    
    public update(delta: number) {
        // Camera controls moved to different keys to avoid conflict with block rotation
        // Use I/K for up/down and J/L for left/right
        if (this.keys['KeyI']) this.camera.moveUp(delta);
        if (this.keys['KeyK']) this.camera.moveDown(delta);
        if (this.keys['KeyJ']) this.camera.moveLeft(delta);
        if (this.keys['KeyL']) this.camera.moveRight(delta);
    }
}
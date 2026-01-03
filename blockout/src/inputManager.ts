import Camera from './camera';

export default class InputManager {
    private keys: { [key: string]: boolean } = {};
    private camera: Camera;
    
    constructor(camera: Camera) {
        this.camera = camera;
        this.setupKeyboardListeners();
    }

    private setupKeyboardListeners(): void {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }
    
    public update(delta: number): void {
        if (this.keys['KeyI']) this.camera.moveUp(delta);
        if (this.keys['KeyK']) this.camera.moveDown(delta);
        if (this.keys['KeyJ']) this.camera.moveLeft(delta);
        if (this.keys['KeyL']) this.camera.moveRight(delta);
    }
}
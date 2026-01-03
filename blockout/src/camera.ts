import * as THREE from 'three';
export default class Camera extends THREE.PerspectiveCamera {
    private renderer: THREE.WebGLRenderer;
    private resizeHandler: () => void;
    private moveSpeed: number = 5;
    private lookSpeed: number = 0.0025;
    private yaw: number = 0;
    private pitch: number = 0;
    private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private ignoreNextMouseMove: boolean = false;
    private keys: { [key: string]: boolean } = {};
    private mouseHandler: (e: MouseEvent) => void;
    private keyDownHandler: (e: KeyboardEvent) => void;
    private keyUpHandler: (e: KeyboardEvent) => void;
    private pointerLockChangeHandler: () => void;
    private canvasClickHandler: () => void;

    constructor(renderer: THREE.WebGLRenderer, fov: number, near: number, far: number)
    {
        super(fov, window.innerWidth / window.innerHeight, near, far);
        this.renderer = renderer;
        this.position.z = 5;
        this.lookAt(0, 0, 0);

        this.resizeHandler = this.onResize.bind(this);
        window.addEventListener('resize', this.resizeHandler);

        this.mouseHandler = this.onMouseMove.bind(this);
        this.keyDownHandler = this.onKeyDown.bind(this);
        this.keyUpHandler = this.onKeyUp.bind(this);
        this.pointerLockChangeHandler = this.onPointerLockChange.bind(this);
        this.canvasClickHandler = () => {
            try {
                (this.renderer.domElement as any).requestPointerLock();
            } catch (err) {
            }
        };

        this.renderer.domElement.addEventListener('click', this.canvasClickHandler);
        document.addEventListener('pointerlockchange', this.pointerLockChangeHandler);
        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);
    }

    private onResize()
    {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.aspect = width / height;
        this.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    private onPointerLockChange()
    {
        const locked = document.pointerLockElement === this.renderer.domElement;
        if (locked) {
            const e = new THREE.Euler().setFromQuaternion(this.quaternion, 'YXZ');
            this.pitch = e.x;
            this.yaw = e.y;
            this.ignoreNextMouseMove = true;
            document.addEventListener('mousemove', this.mouseHandler);
        } else {
            document.removeEventListener('mousemove', this.mouseHandler);
        }
    }

    private onMouseMove(e: MouseEvent)
    {
        if (this.ignoreNextMouseMove) {
            this.ignoreNextMouseMove = false;
            return;
        }
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;

        if (Math.abs(movementX) > 100 || Math.abs(movementY) > 100) return;

        this.yaw -= movementX * this.lookSpeed;
        this.pitch -= movementY * this.lookSpeed;

        const PI_2 = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-PI_2, Math.min(PI_2, this.pitch));

        this.euler.set(this.pitch, this.yaw, 0);
        this.quaternion.setFromEuler(this.euler);
    }

    private onKeyDown(e: KeyboardEvent)
    {
        this.keys[e.code] = true;
    }

    private onKeyUp(e: KeyboardEvent)
    {
        this.keys[e.code] = false;
    }

    public dispose()
    {
        window.removeEventListener('resize', this.resizeHandler);
        this.renderer.domElement.removeEventListener('click', this.canvasClickHandler);
        document.removeEventListener('pointerlockchange', this.pointerLockChangeHandler);
        document.removeEventListener('mousemove', this.mouseHandler);
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
    }

    private calculateRightVec()
    {
        return new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);
    }

    private calculateForwardVec()
    {
        return new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    }

    private addVectorToPos(velocity: THREE.Vector3, delta: number)
    {
        if (velocity.lengthSq() > 0) {
            velocity.normalize();
            this.position.addScaledVector(velocity, this.moveSpeed * delta);
        }
    }

    public moveLeft(delta: number)
    {
        const velocity = new THREE.Vector3();
        const right = this.calculateRightVec();

        velocity.sub(right);
        this.addVectorToPos(velocity, delta);
    }

    public moveRight(delta: number)
    {
        const velocity = new THREE.Vector3();
        const right = this.calculateRightVec();

        velocity.add(right);
        this.addVectorToPos(velocity, delta);
    }

    public moveUp(delta: number)
    {
        const velocity = new THREE.Vector3();
        const forward = this.calculateForwardVec();

        velocity.add(forward);
        this.addVectorToPos(velocity, delta);
    }

    public moveDown(delta: number)
    {
        const velocity = new THREE.Vector3();
        const forward = this.calculateForwardVec();

        velocity.sub(forward);
        this.addVectorToPos(velocity, delta);
    }

}
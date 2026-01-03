import * as THREE from 'three';
import BlockManager from './blocks';
import { Grid } from './Grid';
import { GameState } from './GameState';
import { ScoreUI } from './ScoreUI';
import { RotationController } from './RotationController';
import { BlockRenderer } from './BlockRenderer';

export default class Scene extends THREE.Scene {
    private readonly camera: THREE.PerspectiveCamera;
    private readonly width: number;
    private readonly height: number;
    private readonly depth: number;
    private readonly cellSize: number = 1;
    private readonly ox: number;
    private readonly oy: number;
    private readonly oz: number;

    private movingObjects: THREE.Object3D[] = [];
    private settledObjects: THREE.Object3D[] = [];
    
    private readonly grid: Grid;
    private readonly gameState: GameState;
    private readonly scoreUI: ScoreUI;
    private readonly rotationController: RotationController;
    private readonly blockRenderer: BlockRenderer;
    private readonly blockManager: BlockManager;

    private moveKeys: { [key: string]: boolean } = {};
    private moveProcessed: { [key: string]: boolean } = {};
    private moveKeyDownHandler: (e: KeyboardEvent) => void;
    private moveKeyUpHandler: (e: KeyboardEvent) => void;

    constructor(camera: THREE.PerspectiveCamera) {
        super();
        this.camera = camera;
        this.width = 5;
        this.height = 5;
        this.depth = 10;
        this.cellSize = 1;

        const cx = 0.0;
        const cy = 0.0;
        this.ox = cx - (this.width * this.cellSize) / 2.0 + this.cellSize / 2.0;
        this.oy = cy - (this.height * this.cellSize) / 2.0 + this.cellSize / 2.0;
        this.oz = -this.cellSize / 2.0;

        this.grid = new Grid(this.width, this.height, this.depth, this.cellSize, this.ox, this.oy, this.oz);
        this.gameState = new GameState();
        this.scoreUI = new ScoreUI();
        this.rotationController = new RotationController();
        this.blockRenderer = new BlockRenderer();
        this.blockManager = new BlockManager(this.width, this.height, this.depth);

        this.moveKeyDownHandler = this.onKeyDown.bind(this);
        this.moveKeyUpHandler = this.onKeyUp.bind(this);
        window.addEventListener('keydown', this.moveKeyDownHandler);
        window.addEventListener('keyup', this.moveKeyUpHandler);
    }

    init() {
        this.scoreUI.initialize();
        this.createMainScene(this.width, this.height, this.depth, this.cellSize);
        const axes = new THREE.AxesHelper(2);
        this.add(axes);
    }

    update(delta: number) {
        if (!this.gameState.isGameRunning()) {
            this.generateNextBlock();
            this.gameState.startGame();
            return;
        }

        if (!this.gameState.isMovingEnabled() || this.movingObjects.length === 0) {
            return;
        }

        this.handleInput();
        this.rotationController.update(delta, this.movingObjects);
        this.updateBlockFalling(delta);
    }

    private handleInput(): void {
        if (this.moveKeys['ArrowLeft'] && !this.moveProcessed['ArrowLeft']) {
            this.moveBlock(-1, 0, 0);
            this.moveProcessed['ArrowLeft'] = true;
        }
        if (this.moveKeys['ArrowRight'] && !this.moveProcessed['ArrowRight']) {
            this.moveBlock(1, 0, 0);
            this.moveProcessed['ArrowRight'] = true;
        }
        if (this.moveKeys['ArrowUp'] && !this.moveProcessed['ArrowUp']) {
            this.moveBlock(0, 1, 0);
            this.moveProcessed['ArrowUp'] = true;
        }
        if (this.moveKeys['ArrowDown'] && !this.moveProcessed['ArrowDown']) {
            this.moveBlock(0, -1, 0);
            this.moveProcessed['ArrowDown'] = true;
        }
        if (this.moveKeys['KeyR'] && !this.moveProcessed['KeyR']) {
            this.resetGame();
            this.moveProcessed['KeyR'] = true;
        }
        if (this.moveKeys['Space'] && !this.moveProcessed['Space']) {
            this.hardDrop();
            this.moveProcessed['Space'] = true;
        }

        if (!this.rotationController.isActive()) {
            this.handleRotationInput();
        }
    }

    private handleRotationInput(): void {
        const rotations: Array<[string, 'x' | 'y' | 'z', number]> = [
            ['KeyQ', 'x', -Math.PI / 2],
            ['KeyW', 'y', -Math.PI / 2],
            ['KeyE', 'z', -Math.PI / 2],
            ['KeyA', 'x', Math.PI / 2],
            ['KeyS', 'y', Math.PI / 2],
            ['KeyD', 'z', Math.PI / 2]
        ];

        for (const [key, axis, angle] of rotations) {
            if (this.moveKeys[key] && !this.moveProcessed[key]) {
                this.rotationController.startRotation(axis, angle, this.movingObjects, this.grid);
                this.moveProcessed[key] = true;
                break;
            }
        }
    }

    private moveBlock(dx: number, dy: number, dz: number): void {
        if (this.canMoveInDirection(dx, dy, dz)) {
            this.movingObjects.forEach((obj) => {
                obj.position.x += dx * this.cellSize;
                obj.position.y += dy * this.cellSize;
                obj.position.z += dz * this.cellSize;
            });
        }
    }

    private updateBlockFalling(delta: number): void {
        this.gameState.addStepTime(delta);
        
        if (this.gameState.getStepTimer() >= this.gameState.getMoveTime()) {
            if (this.checkCollisionBelow()) {
                this.settleBlock();
            } else {
                this.movingObjects.forEach(obj => obj.position.z -= this.cellSize);
                this.gameState.subtractStepTime(this.gameState.getMoveTime());
                this.gameState.incrementStep();
            }
        }
    }

    private checkCollisionBelow(): boolean {
        for (const obj of this.movingObjects) {
            const idx = this.grid.worldToGridIndex(obj.position);
            if (!idx) continue;

            const nextZ = idx.z + 1;
            if (nextZ > this.depth || this.grid.isOccupied(idx.x, idx.y, nextZ)) {
                return true;
            }
        }
        return false;
    }

    private settleBlock(): void {
        this.convertMovingBlocksToColored();
        this.settleMovingObjects();
        this.gameState.disableMoving();
        this.gameState.setCanGenerate(true);
        this.checkAndClearFilledLayers();
        this.generateNextBlock();
    }

    private canMoveInDirection(dx: number, dy: number, dz: number): boolean {
        for (const obj of this.movingObjects) {
            const idx = this.grid.worldToGridIndex(obj.position);
            if (!idx) continue;

            const nx = idx.x + dx;
            const ny = idx.y + dy;
            const nz = idx.z + dz;

            if (!this.grid.isInBounds(nx, ny, nz) || this.grid.isOccupied(nx, ny, nz)) {
                return false;
            }
        }
        return true;
    }

    private settleMovingObjects(): void {
        for (const obj of this.movingObjects) {
            const idx = this.grid.worldToGridIndex(obj.position);
            if (idx) {
                this.grid.setOccupied(idx.x, idx.y, idx.z, true);
            }
            this.settledObjects.push(obj);
        }
        this.movingObjects = [];
    }

    private convertMovingBlocksToColored(): void {
        const newMovingObjects: THREE.Object3D[] = [];

        for (const obj of this.movingObjects) {
            const idx = this.grid.worldToGridIndex(obj.position);
            if (!idx) {
                newMovingObjects.push(obj);
                continue;
            }

            const coloredBox = this.blockRenderer.convertToSettledBlock(obj, idx.z);
            this.remove(obj);
            this.add(coloredBox);
            newMovingObjects.push(coloredBox);
        }

        this.movingObjects = newMovingObjects;
    }

    createMainScene(width: number, height: number, depth: number, cellSize: number = 1) {
        depth = depth + 1;
        const material = new THREE.LineBasicMaterial({ color: 0x00aa00 });
        const verts: number[] = [];

        for (let y = 0; y <= height; y++) {
            for (let z = 0; z <= depth; z++) {
                if (z === 0 && y > 0 && y < height) continue;
                if (y === 0 || z === 0 || y === height || z === depth) {
                    verts.push(0, y, z, width, y, z);
                }
            }
        }

        for (let x = 0; x <= width; x++) {
            for (let z = 0; z <= depth; z++) {
                if (z === 0 && x > 0 && x < width) continue;
                if (z === 0 || z === depth || x === 0 || x === width) {
                    verts.push(x, 0, z, x, height, z);
                }
            }
        }

        for (let x = 0; x <= width; x++) {
            for (let y = 0; y <= height; y++) {
                if (x === 0 || y === 0 || y === height || x === width) {
                    verts.push(x, y, 0, x, y, depth);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));

        const gridLines = new THREE.LineSegments(geometry, material);
        gridLines.scale.set(cellSize, cellSize, cellSize);
        gridLines.position.set(
            (width * cellSize) / 2.0,
            -(height * cellSize) / 2.0,
            0.0
        );
        gridLines.rotateY(Math.PI);
        this.add(gridLines);
    }

    private hardDrop(): void {
        if (this.movingObjects.length === 0 || this.rotationController.isActive()) {
            return;
        }

        let maxDrop = this.depth;

        for (const obj of this.movingObjects) {
            const idx = this.grid.worldToGridIndex(obj.position);
            if (!idx) continue;

            let dropDistance = 0;
            for (let dz = 1; dz <= this.depth; dz++) {
                const testZ = idx.z + dz;

                if (testZ > this.depth || this.grid.isOccupied(idx.x, idx.y, testZ)) {
                    dropDistance = dz - 1;
                    break;
                }

                if (testZ === this.depth) {
                    dropDistance = dz;
                    break;
                }
            }

            maxDrop = Math.min(maxDrop, dropDistance);
        }

        if (maxDrop > 0) {
            this.movingObjects.forEach(obj => obj.position.z -= maxDrop * this.cellSize);
        }

        this.settleBlock();
    }

    private checkAndClearFilledLayers(): void {
        let filledLayers = this.grid.getFilledLayers();
        let totalLayersCleared = 0;

        while (filledLayers.length > 0) {
            const layerZ = Math.max(...filledLayers);
            this.clearLayer(layerZ);
            this.shiftLayersForward(layerZ);
            totalLayersCleared++;
            filledLayers = this.grid.getFilledLayers();
        }

        if (totalLayersCleared > 0) {
            this.gameState.addScore(totalLayersCleared * 100);
            this.scoreUI.updateScore(this.gameState.getScore());
        }
    }

    private clearLayer(layerZ: number): void {
        const objectsToRemove: THREE.Object3D[] = [];

        for (const obj of this.settledObjects) {
            const idx = this.grid.worldToGridIndex(obj.position);
            if (idx && idx.z === layerZ) {
                objectsToRemove.push(obj);
                this.remove(obj);
            }
        }

        this.settledObjects = this.settledObjects.filter(obj => !objectsToRemove.includes(obj));
        this.grid.clearLayer(layerZ);
    }

    private shiftLayersForward(clearedLayerZ: number): void {
        for (const obj of this.settledObjects) {
            const idx = this.grid.worldToGridIndex(obj.position);
            if (idx && idx.z < clearedLayerZ) {
                obj.position.z -= this.cellSize;
            }
        }

        this.grid.rebuildFromObjects(this.settledObjects);
        this.updateSettledBlocksColors();
    }

    private updateSettledBlocksColors(): void {
        for (const obj of this.settledObjects) {
            if (!(obj instanceof THREE.Mesh)) continue;
            
            const idx = this.grid.worldToGridIndex(obj.position);
            if (idx) {
                this.blockRenderer.updateBlockColor(obj, idx.z);
            }
        }
    }

    private generateNextBlock(): void {
        if (!this.gameState.canGenerate() && this.gameState.isGameRunning()) {
            return;
        }

        this.gameState.setCanGenerate(false);
        const blockArray = this.blockManager.getRandomBlockArray();
        const newBlocks = this.blockRenderer.buildBlocksFromArray(blockArray, this.grid, true);

        newBlocks.forEach(block => {
            this.add(block);
            this.movingObjects.push(block);
        });

        if (this.checkIfLost()) {
            alert('Game Over! Your score: ' + this.gameState.getScore());
            this.resetGame();
            return;
        }

        this.gameState.enableMoving();
        this.gameState.resetStep();
        this.gameState.resetStepTimer();
    }

    private resetGame(): void {
        this.grid.clear();
        this.settledObjects.forEach(obj => this.remove(obj));
        this.settledObjects = [];
        this.movingObjects.forEach(obj => this.remove(obj));
        this.movingObjects = [];
        this.gameState.reset();
        this.scoreUI.updateScore(0);
    }

    private checkIfLost(): boolean {
        for (const obj of this.movingObjects) {
            const idx = this.grid.worldToGridIndex(obj.position);
            if (idx && this.grid.isOccupied(idx.x, idx.y, idx.z)) {
                return true;
            }
        }
        return false;
    }

    private onKeyDown(e: KeyboardEvent): void {
        this.moveKeys[e.code] = true;
    }

    private onKeyUp(e: KeyboardEvent): void {
        this.moveKeys[e.code] = false;
        this.moveProcessed[e.code] = false;
    }
}

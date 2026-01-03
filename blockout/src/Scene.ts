import * as THREE from 'three';
import { create3DArray } from './blocks';
import block from './blocks';

export default class Scene extends THREE.Scene {

    private readonly camera: THREE.PerspectiveCamera;
    private readonly objects: THREE.Object3D[] = [];
    private width: number;
    private height: number;
    private depth: number;
    private cellSize: number = 1;
    private ox: number;
    private oy: number;
    private oz: number;
    private cx: number;
    private cy: number;
    private cz: number;
    private moveTime: number = 0.5;
    private currentStep: number = 0;
    private stepTimer: number = 0.0;
    private grid: number[][][];
    private canGenerateNext: boolean = false;
    private movingEnabled: boolean = true;
    private movingObjects: THREE.Object3D[] = [];
    private settledObjects: THREE.Object3D[] = [];
    private blockManager: block;
    private moveKeys: { [key: string]: boolean } = {};
    private moveProcessed: { [key: string]: boolean } = {};
    private rotateKeys: { [key: string]: boolean } = {};
    private rotateProcessed: { [key: string]: boolean } = {};
    private moveKeyDownHandler: (e: KeyboardEvent) => void;
    private moveKeyUpHandler: (e: KeyboardEvent) => void;
    private score: number = 0;
    private scoreElement: HTMLElement | null = null;
    
    // Rotation animation
    private isRotating: boolean = false;
    private rotationProgress: number = 0;
    private rotationDuration: number = 0.15; // seconds
    private rotationAxis: 'x' | 'y' | 'z' = 'x';
    private rotationAngle: number = 0;
    private rotationCenter: THREE.Vector3 = new THREE.Vector3();
    private rotationStartPositions: THREE.Vector3[] = [];
    private rotationTargetPositions: THREE.Vector3[] = [];

    constructor(camera: THREE.PerspectiveCamera)
    {
        super();
        this.camera = camera;
        this.width = 5;
        this.height = 5;
        this.depth = 10;

        // Center (start) point
        this.cx = 0.0;
        this.cy = 0.0;
        this.cz = 0.0 - this.cellSize / 2.0;

        this.ox = this.cx - (this.width * this.cellSize) / 2.0 + this.cellSize / 2.0;
        this.oy = this.cy - (this.height * this.cellSize) / 2.0 + this.cellSize / 2.0;
        this.oz = - this.cellSize / 2.0;
        
        this.grid = create3DArray<number>(this.width, this.height, this.depth + 1, 0);
        this.blockManager = new block(this.width, this.height, this.depth);

        this.moveKeyDownHandler = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.moveKeyDownHandler);
        this.moveKeyUpHandler = this.onKeyUp.bind(this);
        window.addEventListener('keyup', this.moveKeyUpHandler);
    }

    init()
    {
        this.createScoreUI();
        this.createMainScene(this.width, this.height, this.depth, this.cellSize);
        const axes = new THREE.AxesHelper(2);
        this.add(axes);

        // const tempArr = create3DArray<number>(this.width, this.height, 2, 0);
        // tempArr[0][0][0] = 1;
        // tempArr[1][1][0] = 1;
        // tempArr[0][1][1] = 1;
        const tempArr = this.blockManager.getBlockArray(17);

        this.buildCubeBasedOnGrid(tempArr, true);
    }

    update(delta: number)
    {
        if (!this.movingEnabled) return;
        // if there are no moving objects, nothing to move
        if (this.movingObjects.length === 0) return;

        if (this.moveKeys['ArrowLeft'] && !this.moveProcessed['ArrowLeft']) {
            if (this.canMoveInDirection(-1, 0, 0)) {
                this.movingObjects.forEach((obj) => {
                    obj.position.x -= this.cellSize;
                });
            }
            this.moveProcessed['ArrowLeft'] = true;
        }
        if (this.moveKeys['ArrowRight'] && !this.moveProcessed['ArrowRight']) {
            if (this.canMoveInDirection(1, 0, 0)) {
                this.movingObjects.forEach((obj) => {
                    obj.position.x += this.cellSize;
                });
            }
            this.moveProcessed['ArrowRight'] = true;
        }
        if (this.moveKeys['ArrowUp'] && !this.moveProcessed['ArrowUp']) {
            if (this.canMoveInDirection(0, 1, 0)) {
                this.movingObjects.forEach((obj) => {
                    obj.position.y += this.cellSize;
                });
            }
            this.moveProcessed['ArrowUp'] = true;
        }
        if (this.moveKeys['ArrowDown'] && !this.moveProcessed['ArrowDown']) {
            if (this.canMoveInDirection(0, -1, 0)) {
                this.movingObjects.forEach((obj) => {
                    obj.position.y -= this.cellSize;
                });
            }
            this.moveProcessed['ArrowDown'] = true;
        }
        if (this.moveKeys['KeyR'] && !this.moveProcessed['KeyR']) {
            this.clearGrid();
        }
        if (this.moveKeys['Space'] && !this.moveProcessed['Space']) {
            this.hardDrop();
            this.moveProcessed['Space'] = true;
        }

        // Rotation controls - only start rotation if not already rotating
        if (!this.isRotating) {
            if (this.moveKeys['KeyQ'] && !this.moveProcessed['KeyQ']) {
                this.startRotation('x', -Math.PI / 2); // counter-clockwise around X
                this.moveProcessed['KeyQ'] = true;
            }
            else if (this.moveKeys['KeyW'] && !this.moveProcessed['KeyW']) {
                this.startRotation('y', -Math.PI / 2); // counter-clockwise around Y
                this.moveProcessed['KeyW'] = true;
            }
            else if (this.moveKeys['KeyE'] && !this.moveProcessed['KeyE']) {
                this.startRotation('z', -Math.PI / 2); // counter-clockwise around Z
                this.moveProcessed['KeyE'] = true;
            }
            else if (this.moveKeys['KeyA'] && !this.moveProcessed['KeyA']) {
                this.startRotation('x', Math.PI / 2); // clockwise around X
                this.moveProcessed['KeyA'] = true;
            }
            else if (this.moveKeys['KeyS'] && !this.moveProcessed['KeyS']) {
                this.startRotation('y', Math.PI / 2); // clockwise around Y
                this.moveProcessed['KeyS'] = true;
            }
            else if (this.moveKeys['KeyD'] && !this.moveProcessed['KeyD']) {
                this.startRotation('z', Math.PI / 2); // clockwise around Z
                this.moveProcessed['KeyD'] = true;
            }
        }
        
        // Update rotation animation
        if (this.isRotating) {
            this.updateRotation(delta);
        }

        this.stepTimer += delta;
        if (this.stepTimer >= this.moveTime) {
            // check whether moving objects would collide if moved one step deeper
            let collision = false;
            for (const obj of this.movingObjects) {
                const idx = this.worldToGridIndex(obj.position);
                if (!idx) continue;
                const nx = idx.x;
                const ny = idx.y;
                const nz = idx.z + 1; // next depth index

                // collision with floor
                if (nz > this.depth) {
                    collision = true;
                    break;
                }

                // collision with settled block
                if (this.grid[nx] && this.grid[nx][ny] && this.grid[nx][ny][nz] === 1) {
                    collision = true;
                    break;
                }
            }

            if (collision) {
                // console.log(this.grid);
                // settle moving objects in place
                this.convertMovingBlocksToColored();
                this.settleMovingObjects();
                this.movingEnabled = false;
                this.canGenerateNext = true;
                
                // Check and clear filled layers, update score
                this.checkAndClearFilledLayers();
                
                // generate next block (new shape)
                this.generateNextBlock();
                // console.log(this.grid);

            } else {
                // perform move: shift all moving objects one cell deeper (-Z)
                for (const obj of this.movingObjects) {
                    obj.position.z -= this.cellSize;
                }
                this.stepTimer -= this.moveTime;
                this.currentStep += 1;
                if (this.currentStep >= this.depth) this.currentStep = this.depth;
            }
        }

        if(this.canGenerateNext)
        {

        }
    }

    createMainScene(width: number, height: number, depth: number, cellSize: number = 1)
    {
        depth = depth + 1;
        const material = new THREE.LineBasicMaterial({ color: 0x00aaff });
        const verts: number[] = [];

        for (let y = 0; y <= height; y++)
        {
            for (let z = 0; z <= depth; z++)
            {
                if (z === 0 && y > 0 && y < height) continue;
                if (y===0 || z === 0 || y=== height || z===depth){
                    verts.push(
                        0, y, z,
                        width, y, z
                    );
                }
            }
        }

        for (let x = 0; x <= width; x++)
        {
            for (let z = 0; z <= depth; z++)
            {
                if (z === 0 && x > 0 && x < width) continue;
                if (z===0 || z === depth || x===0 || x===width){
                    verts.push(
                        x, 0, z,
                        x, height, z
                    );
                }
            }
        }

        for (let x = 0; x <= width; x++)
        {
            for (let y = 0; y <= height; y++)
            {
                if (x===0 || y === 0 || y=== height || x===width){
                    verts.push(
                        x, y, 0,
                        x, y, depth
                    );
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));

            const grid = new THREE.LineSegments(geometry, material);
            grid.scale.set(cellSize, cellSize, cellSize);
            const posX = (width * cellSize) / 2.0;
            const posY = -(height * cellSize) / 2.0;
            const posZ = 0.0;
            grid.position.set(posX, posY, posZ);
            grid.rotateY(Math.PI);
        this.add(grid);
    }

    private buildCubeBasedOnGrid(arr: number[][][], moving: boolean = true)
    {
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const dx = arr.length;
        const dy = arr[0]?.length ?? 0;
        const dz = arr[0]?.[0]?.length ?? 0;
        for (let x = 0; x < dx; x++) {
            for (let y = 0; y < dy; y++) {
                for (let z = 0; z < dz; z++) {
                    if (arr[x][y][z] === 1) {
                        let box: THREE.Object3D;
                        
                        if (moving) {
                            // For moving blocks: only white edges, no fill
                            const edges = new THREE.EdgesGeometry(boxGeometry);
                            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
                            box = new THREE.LineSegments(edges, lineMaterial);
                        } else {
                            // For settled blocks: colored based on depth
                            const worldPos = new THREE.Vector3(
                                this.ox + x * this.cellSize,
                                this.oy + y * this.cellSize,
                                this.oz - z * this.cellSize
                            );
                            const idx = this.worldToGridIndex(worldPos);
                            const depthColor = this.getColorForDepth(idx ? idx.z : 0);
                            const material = new THREE.MeshBasicMaterial({ color: depthColor });
                            box = new THREE.Mesh(boxGeometry, material);
                        }
                        
                        box.position.set(
                            this.ox + x * this.cellSize,
                            this.oy + y * this.cellSize,
                            this.oz - z * this.cellSize
                        );
                        this.add(box);
                        this.objects.push(box);
                        if (moving) {
                            this.movingObjects.push(box);
                        } else {
                            this.settledObjects.push(box);
                            // mark occupied cell in grid (use x,y,z from loop)
                            if (x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z <= this.depth) {
                                this.grid[x][y][z] = 1;
                            }
                        }
                    }
                }
            }
        }
    }


    // rebuild numeric occupancy grid based on current objects' world positions
    private rebuildGridFromObjects()
    {
        // clear
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (let z = 0; z < this.depth + 1; z++) {
                    this.grid[x][y][z] = 0;
                }
            }
        }

        // for each settled object, compute grid indices and mark
        for (const obj of this.settledObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (!idx) continue;
            const { x, y, z } = idx;
            if (x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z <= this.depth) {
                this.grid[x][y][z] = 1;
            }
        }
    }

    private worldToGridIndex(pos: THREE.Vector3): { x: number; y: number; z: number } | null
    {
        // inverse of buildCubeBasedOnGrid placement
        const fx = (pos.x - this.ox) / this.cellSize;
        const fy = (pos.y - this.oy) / this.cellSize;
        const fz = (this.oz - pos.z) / this.cellSize;
        const ix = Math.round(fx);
        const iy = Math.round(fy);
        const iz = Math.round(fz);
        return { x: ix, y: iy, z: iz };
    }

    private canMoveInDirection(dx: number, dy: number, dz: number): boolean
    {
        for (const obj of this.movingObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (!idx) continue;
            
            const nx = idx.x + dx;
            const ny = idx.y + dy;
            const nz = idx.z + dz;

            // check if next position would be out of bounds
            if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height || nz < 0 || nz > this.depth) {
                return false;
            }

            // check collision with settled blocks
            if (this.grid[nx] && this.grid[nx][ny] && this.grid[nx][ny][nz] === 1) {
                return false;
            }
        }
        return true;
    }

    private settleMovingObjects()
    {
        for (const obj of this.movingObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (!idx) continue;
            const { x, y, z } = idx;
            if (x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z <= this.depth) {
                this.grid[x][y][z] = 1;
            }
            this.settledObjects.push(obj);
        }
        this.movingObjects.length = 0;
    }

    private hardDrop(): void
    {
        if (this.movingObjects.length === 0) return;
        if (this.isRotating) return; // Don't allow hard drop during rotation
        
        // Find the lowest position where the block can drop
        let maxDrop = this.depth;
        
        for (const obj of this.movingObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (!idx) continue;
            
            // For this cube, find how far down it can go
            let dropDistance = 0;
            for (let dz = 1; dz <= this.depth; dz++) {
                const testZ = idx.z + dz;
                
                // Check if hit floor
                if (testZ > this.depth) {
                    dropDistance = dz - 1;
                    break;
                }
                
                // Check if hit settled block
                if (this.grid[idx.x] && this.grid[idx.x][idx.y] && this.grid[idx.x][idx.y][testZ] === 1) {
                    dropDistance = dz - 1;
                    break;
                }
                
                // If we've checked all the way to the bottom
                if (testZ === this.depth) {
                    dropDistance = dz;
                    break;
                }
            }
            
            // Use the minimum drop distance across all cubes
            maxDrop = Math.min(maxDrop, dropDistance);
        }
        
        // Move all objects down by the drop distance
        if (maxDrop > 0) {
            this.movingObjects.forEach(obj => {
                obj.position.z -= maxDrop * this.cellSize;
            });
        }
        
        // Immediately settle the block
        this.convertMovingBlocksToColored();
        this.settleMovingObjects();
        this.movingEnabled = false;
        this.canGenerateNext = true;
        
        // Check and clear filled layers, update score
        this.checkAndClearFilledLayers();
        
        // Generate next block
        this.generateNextBlock();
    }

    private checkIfWallfilled(): number[]
    {
        // Returns array of depth indices that are completely filled
        const filledLayers: number[] = [];
        for (let z = 0; z <= this.depth; z++) {
            let filled = true;
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    if (this.grid[x][y][z] === 0) {
                        filled = false;
                        break;
                    }
                }
                if (!filled) break;
            }
            if (filled) {
                filledLayers.push(z);
            }
        }
        return filledLayers;
    }

    private checkAndClearFilledLayers(): void
    {
        // Keep checking and clearing until no more filled layers exist
        // This is needed because after shifting, layer indices change
        let filledLayers = this.checkIfWallfilled();
        let totalLayersCleared = 0;
        
        while (filledLayers.length > 0) {
            // Always clear the deepest filled layer first
            const layerZ = Math.max(...filledLayers);
            
            this.clearLayer(layerZ);
            this.shiftLayersForward(layerZ);
            
            totalLayersCleared++;
            
            // Re-check for filled layers after shifting
            filledLayers = this.checkIfWallfilled();
        }
        
        // Add points for all cleared layers
        if (totalLayersCleared > 0) {
            const pointsPerLayer = 100;
            this.score += totalLayersCleared * pointsPerLayer;
            this.updateScoreDisplay();
        }
    }

    private clearLayer(layerZ: number): void
    {
        // Remove all objects at this depth
        const objectsToRemove: THREE.Object3D[] = [];
        
        for (const obj of this.settledObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (idx && idx.z === layerZ) {
                objectsToRemove.push(obj);
                this.remove(obj);
            }
        }
        
        // Remove from settledObjects array
        for (const obj of objectsToRemove) {
            const index = this.settledObjects.indexOf(obj);
            if (index > -1) {
                this.settledObjects.splice(index, 1);
            }
        }
        
        // Clear from grid
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.grid[x][y][layerZ] = 0;
            }
        }
    }

    private shiftLayersForward(clearedLayerZ: number): void
    {
        // Move all blocks from layers before (smaller z) the cleared layer forward by one depth
        for (const obj of this.settledObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (idx && idx.z < clearedLayerZ) {
                // Move object forward (increase z position in world = move in +z direction)
                obj.position.z -= this.cellSize; // remember z decreases as we go deeper
            }
        }
        
        // Rebuild grid after shifting
        this.rebuildGridFromObjects();
        
        // Update colors based on new depth positions
        this.updateSettledBlocksColors();
    }

    private updateSettledBlocksColors(): void
    {
        // Update colors of all settled blocks based on their current depth
        for (const obj of this.settledObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (!idx) continue;
            
            // Check if this is a Mesh (colored block, not wireframe)
            if (obj instanceof THREE.Mesh) {
                const depthColor = this.getColorForDepth(idx.z);
                const material = obj.material as THREE.MeshBasicMaterial;
                material.color.setHex(depthColor);
            }
        }
    }

    private createScoreUI(): void
    {
        // Create score display element
        const scoreDiv = document.createElement('div');
        scoreDiv.id = 'score-display';
        scoreDiv.style.position = 'absolute';
        scoreDiv.style.top = '20px';
        scoreDiv.style.left = '20px';
        scoreDiv.style.color = 'white';
        scoreDiv.style.fontFamily = 'Arial, sans-serif';
        scoreDiv.style.fontSize = '24px';
        scoreDiv.style.fontWeight = 'bold';
        scoreDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        scoreDiv.style.zIndex = '1000';
        scoreDiv.textContent = 'Score: 0';
        
        document.body.appendChild(scoreDiv);
        this.scoreElement = scoreDiv;
    }

    private updateScoreDisplay(): void
    {
        if (this.scoreElement) {
            this.scoreElement.textContent = `Score: ${this.score}`;
        }
    }

    // generate a new block with slightly different shape when previous block reached bottom
    private generateNextBlock()
    {
        if (!this.canGenerateNext) return;
        this.canGenerateNext = false;

        const arr = this.blockManager.getRandomBlockArray();
        this.buildCubeBasedOnGrid(arr, true);

        // after creating new block, re-enable movement if desired
        this.movingEnabled = true;
        this.currentStep = 0;
        this.stepTimer = 0.0;
    }

    private clearGrid()
    {
        this.grid = create3DArray<number>(this.width, this.height, this.depth + 1, 0);
        this.settledObjects.forEach((obj) => {
            this.remove(obj);
        });
    }

    private startRotation(axis: 'x' | 'y' | 'z', angle: number): void
    {
        if (this.movingObjects.length === 0) return;
        if (this.isRotating) return; // Don't start new rotation if already rotating

        // Store original positions
        this.rotationStartPositions = this.movingObjects.map(obj => obj.position.clone());
        
        // Convert current positions to grid indices
        const gridPositions: Array<{x: number, y: number, z: number}> = [];
        for (const obj of this.movingObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (idx) {
                gridPositions.push(idx);
            } else {
                // If we can't get grid index, abort rotation
                return;
            }
        }
        
        // Calculate center of mass in grid space
        const centerGrid = {x: 0, y: 0, z: 0};
        gridPositions.forEach(pos => {
            centerGrid.x += pos.x;
            centerGrid.y += pos.y;
            centerGrid.z += pos.z;
        });
        centerGrid.x /= gridPositions.length;
        centerGrid.y /= gridPositions.length;
        centerGrid.z /= gridPositions.length;
        
        // Calculate rotated grid positions
        const rotatedGridPositions: Array<{x: number, y: number, z: number}> = [];
        const direction = angle > 0 ? 1 : -1; // 1 for clockwise, -1 for counter-clockwise
        
        for (const pos of gridPositions) {
            // Translate to origin (relative to center)
            const relX = pos.x - centerGrid.x;
            const relY = pos.y - centerGrid.y;
            const relZ = pos.z - centerGrid.z;
            
            // Apply rotation matrix (90 degrees)
            let newRelX = relX, newRelY = relY, newRelZ = relZ;
            
            if (axis === 'x') {
                // Rotate around X axis: y' = z, z' = -y (for +90) or y' = -z, z' = y (for -90)
                newRelY = direction * relZ;
                newRelZ = -direction * relY;
            } else if (axis === 'y') {
                // Rotate around Y axis: x' = -z, z' = x (for +90) or x' = z, z' = -x (for -90)
                newRelX = -direction * relZ;
                newRelZ = direction * relX;
            } else if (axis === 'z') {
                // Rotate around Z axis: x' = y, y' = -x (for +90) or x' = -y, y' = x (for -90)
                newRelX = direction * relY;
                newRelY = -direction * relX;
            }
            
            // Translate back and round to nearest integer
            const newX = Math.round(newRelX + centerGrid.x);
            const newY = Math.round(newRelY + centerGrid.y);
            const newZ = Math.round(newRelZ + centerGrid.z);
            
            rotatedGridPositions.push({x: newX, y: newY, z: newZ});
        }
        
        // Check if all rotated positions are valid
        for (const pos of rotatedGridPositions) {
            // Check bounds
            if (pos.x < 0 || pos.x >= this.width || 
                pos.y < 0 || pos.y >= this.height || 
                pos.z < 0 || pos.z > this.depth) {
                // Rotation would move block out of bounds, abort
                return;
            }
            
            // Check collision with settled blocks
            if (this.grid[pos.x] && this.grid[pos.x][pos.y] && this.grid[pos.x][pos.y][pos.z] === 1) {
                // Collision detected, abort
                return;
            }
        }
        
        // Check for duplicate positions in rotated block (blocks overlapping)
        const positionSet = new Set<string>();
        for (const pos of rotatedGridPositions) {
            const key = `${pos.x},${pos.y},${pos.z}`;
            if (positionSet.has(key)) {
                // Duplicate position detected, abort rotation
                return;
            }
            positionSet.add(key);
        }
        
        // All checks passed, convert grid positions to world positions
        this.rotationTargetPositions = rotatedGridPositions.map(pos => 
            new THREE.Vector3(
                this.ox + pos.x * this.cellSize,
                this.oy + pos.y * this.cellSize,
                this.oz - pos.z * this.cellSize
            )
        );
        
        // Calculate rotation center in world space
        this.rotationCenter = new THREE.Vector3();
        this.rotationStartPositions.forEach(pos => {
            this.rotationCenter.add(pos);
        });
        this.rotationCenter.divideScalar(this.rotationStartPositions.length);
        
        // Set rotation parameters
        this.isRotating = true;
        this.rotationProgress = 0;
        this.rotationAxis = axis;
        this.rotationAngle = angle;
    }
    
    private updateRotation(delta: number): void
    {
        if (!this.isRotating) return;
        
        this.rotationProgress += delta;
        const t = Math.min(this.rotationProgress / this.rotationDuration, 1.0);
        
        // Easing function for smoother animation (ease-out cubic)
        const eased = 1 - Math.pow(1 - t, 3);
        
        // Interpolate between start and target positions
        this.movingObjects.forEach((obj, index) => {
            const startPos = this.rotationStartPositions[index];
            const targetPos = this.rotationTargetPositions[index];
            
            // Linear interpolation for each coordinate
            obj.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
            obj.position.y = startPos.y + (targetPos.y - startPos.y) * eased;
            obj.position.z = startPos.z + (targetPos.z - startPos.z) * eased;
        });
        
        // Check if animation is complete
        if (t >= 1.0) {
            this.finishRotation();
        }
    }
    
    private finishRotation(): void
    {
        // Set exact target positions (already validated in startRotation)
        this.movingObjects.forEach((obj, index) => {
            obj.position.copy(this.rotationTargetPositions[index]);
        });
        
        // Reset rotation state
        this.isRotating = false;
        this.rotationProgress = 0;
        this.rotationStartPositions = [];
        this.rotationTargetPositions = [];
    }

    private getColorForDepth(z: number): number
    {
        // Color gradient from blue (depth 0) to red (depth = max)
        // Using Blockout-style colors
        const colors = [
            0x0088FF, // Blue (front/top)
            0x00AAFF,
            0x00CCFF,
            0x00FFFF, // Cyan
            0x00FFAA,
            0x00FF88,
            0x00FF00, // Green
            0x88FF00,
            0xFFFF00, // Yellow
            0xFFAA00,
            0xFF0000  // Red (back/bottom)
        ];
        
        // Map depth to color index
        const colorIndex = Math.floor((z / this.depth) * (colors.length - 1));
        return colors[Math.min(colorIndex, colors.length - 1)];
    }

    private convertMovingBlocksToColored(): void
    {
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const newMovingObjects: THREE.Object3D[] = [];
        
        // Replace each wireframe block with colored mesh
        for (const obj of this.movingObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (!idx) {
                newMovingObjects.push(obj);
                continue;
            }
            
            const depthColor = this.getColorForDepth(idx.z);
            const material = new THREE.MeshBasicMaterial({ color: depthColor });
            const coloredBox = new THREE.Mesh(boxGeometry, material);
            coloredBox.position.copy(obj.position);
            
            // Remove old wireframe and add colored mesh
            this.remove(obj);
            this.add(coloredBox);
            
            // Replace in objects array
            const objIndex = this.objects.indexOf(obj);
            if (objIndex > -1) {
                this.objects[objIndex] = coloredBox;
            }
            
            // Add to new moving objects array
            newMovingObjects.push(coloredBox);
        }
        
        // Replace the entire movingObjects array
        this.movingObjects = newMovingObjects;
    }

    private onKeyDown(e: KeyboardEvent)
    {
        this.moveKeys[e.code] = true;
    }

    private onKeyUp(e: KeyboardEvent)
    {
        this.moveKeys[e.code] = false;
        this.moveProcessed[e.code] = false;
    }
}
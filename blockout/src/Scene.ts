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
    private moveTime: number = 1;
    private currentStep: number = 0;
    private stepTimer: number = 0.0;
    private grid: number[][][];
    private canGenerateNext: boolean = false;
    private movingEnabled: boolean = true;
    private movingObjects: THREE.Object3D[] = [];
    private settledObjects: THREE.Object3D[] = [];
    private blockManager: block;

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
        
        this.grid = create3DArray<number>(this.width, this.height, this.depth, 0);
        this.blockManager = new block(this.width, this.height, this.depth);
    }

    init()
    {
        this.createMainScene(this.width, this.height, this.depth, this.cellSize);
        const axes = new THREE.AxesHelper(2);
        this.add(axes);

        // const tempArr = create3DArray<number>(this.width, this.height, 2, 0);
        // tempArr[0][0][0] = 1;
        // tempArr[1][1][0] = 1;
        // tempArr[0][1][1] = 1;
        const tempArr = this.blockManager.getBlockArray();

        this.buildCubeBasedOnGrid(tempArr, true);
    }

    update(delta: number)
    {
        if (!this.movingEnabled) return;
        // if there are no moving objects, nothing to move
        if (this.movingObjects.length === 0) return;

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
                if (nz >= this.depth + 1) {
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
                // settle moving objects in place
                this.settleMovingObjects();
                this.movingEnabled = false;
                this.canGenerateNext = true;
                // generate next block (new shape)
                this.generateNextBlock();
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
        const material = new THREE.MeshNormalMaterial();
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const dx = arr.length;
        const dy = arr[0]?.length ?? 0;
        const dz = arr[0]?.[0]?.length ?? 0;
        for (let x = 0; x < dx; x++) {
            for (let y = 0; y < dy; y++) {
                for (let z = 0; z < dz; z++) {
                    if (arr[x][y][z] === 1) {
                        const box = new THREE.Mesh(boxGeometry, material);
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
                            if (x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.depth + 1) {
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
                for (let z = 0; z < this.depth; z++) {
                    this.grid[x][y][z] = 0;
                }
            }
        }

        // for each settled object, compute grid indices and mark
        for (const obj of this.settledObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (!idx) continue;
            const { x, y, z } = idx;
            if (x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.depth) {
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

    private settleMovingObjects()
    {
        for (const obj of this.movingObjects) {
            const idx = this.worldToGridIndex(obj.position);
            if (!idx) continue;
            const { x, y, z } = idx;
            if (x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.depth + 1) {
                this.grid[x][y][z] = 1;
            }
            this.settledObjects.push(obj);
        }
        this.movingObjects.length = 0;
    }

    // generate a new block with slightly different shape when previous block reached bottom
    private generateNextBlock()
    {
        if (!this.canGenerateNext) return;
        this.canGenerateNext = false;

        // create a simple random shape (2-layer tall) — different each time
        const arr = create3DArray<number>(this.width, this.height, 2, 0);
        const count = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            const z = Math.floor(Math.random() * 2);
            arr[x][y][z] = 1;
        }

        // create new meshes from arr
        this.buildCubeBasedOnGrid(arr, true);

        // after creating new block, re-enable movement if desired
        this.movingEnabled = true;
        this.currentStep = 0;
        this.stepTimer = 0.0;
        // rebuild grid to include newly generated block
        this.rebuildGridFromObjects();
    }

}
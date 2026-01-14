import * as THREE from 'three';

export interface GridIndex {
    x: number;
    y: number;
    z: number;
}

export class Grid {
    private data: number[][][];
    private readonly width: number;
    private readonly height: number;
    private readonly depth: number;
    private readonly cellSize: number;
    private readonly ox: number;
    private readonly oy: number;
    private readonly oz: number;

    constructor(width: number, height: number, depth: number, cellSize: number, ox: number, oy: number, oz: number) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.cellSize = cellSize;
        this.ox = ox;
        this.oy = oy;
        this.oz = oz;
        this.data = this.create3DArray(width, height, depth + 1, 0);
    }

    private create3DArray<T>(x: number, y: number, z: number, initial: T): T[][][] {
        return Array.from({ length: x }, () =>
            Array.from({ length: y }, () =>
                Array.from({ length: z }, () => initial)
            )
        );
    }

    public worldToGridIndex(pos: THREE.Vector3): GridIndex | null {
        const fx = (pos.x - this.ox) / this.cellSize;
        const fy = (pos.y - this.oy) / this.cellSize;
        const fz = (this.oz - pos.z) / this.cellSize;
        const ix = Math.round(fx);
        const iy = Math.round(fy);
        const iz = Math.round(fz);
        return { x: ix, y: iy, z: iz };
    }

    public gridToWorldPosition(idx: GridIndex): THREE.Vector3 {
        return new THREE.Vector3(
            this.ox + idx.x * this.cellSize,
            this.oy + idx.y * this.cellSize,
            this.oz - idx.z * this.cellSize
        );
    }

    public isOccupied(x: number, y: number, z: number): boolean {
        if (!this.isInBounds(x, y, z)) {
            return true; // poza siatką
        }
        return this.data[x]?.[y]?.[z] === 1;
    }

    public setOccupied(x: number, y: number, z: number, value: boolean): void {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z <= this.depth) {
            this.data[x][y][z] = value ? 1 : 0;
        }
    }

    public isInBounds(x: number, y: number, z: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z <= this.depth;
    }

    public clear(): void {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (let z = 0; z <= this.depth; z++) {
                    this.data[x][y][z] = 0;
                }
            }
        }
    }

    public rebuildFromObjects(objects: THREE.Object3D[]): void {
        this.clear();
        for (const obj of objects) {
            const idx = this.worldToGridIndex(obj.position);
            if (idx) {
                this.setOccupied(idx.x, idx.y, idx.z, true);
            }
        }
    }

    public isLayerFilled(z: number): boolean {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.data[x][y][z] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    public getFilledLayers(): number[] {
        const filled: number[] = [];
        for (let z = 0; z <= this.depth; z++) {
            if (this.isLayerFilled(z)) {
                filled.push(z);
            }
        }
        return filled;
    }

    public clearLayer(z: number): void {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.data[x][y][z] = 0;
            }
        }
    }

    public getWidth(): number { return this.width; }
    public getHeight(): number { return this.height; }
    public getDepth(): number { return this.depth; }
    public getCellSize(): number { return this.cellSize; }
}

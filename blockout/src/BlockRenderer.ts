import * as THREE from 'three';
import { Grid } from './Grid';

export class BlockRenderer {
    private readonly boxGeometry: THREE.BoxGeometry;
    private readonly colors: number[];

    constructor() {
        this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.colors = this.generateColorGradient();
    }

    private generateColorGradient(): number[] {
        return [
            0x00aaaa,
            0x00aa00,
            0x0000aa,
            0xaaaaaa,
            0xaa5500,
            0xaa00aa,
            0xaa0000,
            0x00aaaa,
            0x00aa00,
            0x0000aa,
            0xaaaaaa
        ];
    }

    public createMovingBlock(position: THREE.Vector3): THREE.LineSegments {
        const edges = new THREE.EdgesGeometry(this.boxGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const block = new THREE.LineSegments(edges, lineMaterial);
        block.position.copy(position);
        return block;
    }

    public createSettledBlock(position: THREE.Vector3, depth: number): THREE.Mesh {
        const depthColor = this.getColorForDepth(depth);
        const material = new THREE.MeshBasicMaterial({ color: depthColor });
        const block = new THREE.Mesh(this.boxGeometry, material);
        block.position.copy(position);
        return block;
    }

    public convertToSettledBlock(wireframeBlock: THREE.Object3D, depth: number): THREE.Mesh {
        const depthColor = this.getColorForDepth(depth);
        const material = new THREE.MeshBasicMaterial({ color: depthColor });
        const block = new THREE.Mesh(this.boxGeometry, material);
        block.position.copy(wireframeBlock.position);
        return block;
    }

    public updateBlockColor(block: THREE.Mesh, depth: number): void {
        const depthColor = this.getColorForDepth(depth);
        const material = block.material as THREE.MeshBasicMaterial;
        material.color.setHex(depthColor);
    }

    private getColorForDepth(z: number): number {
        const colorIndex = Math.floor((z / this.colors.length) * (this.colors.length - 1));
        return this.colors[Math.min(colorIndex, this.colors.length - 1)];
    }

    public buildBlocksFromArray(
        array: number[][][],
        grid: Grid,
        isMoving: boolean
    ): THREE.Object3D[] {
        const blocks: THREE.Object3D[] = [];
        const dx = array.length;
        const dy = array[0]?.length ?? 0;
        const dz = array[0]?.[0]?.length ?? 0;

        for (let x = 0; x < dx; x++) {
            for (let y = 0; y < dy; y++) {
                for (let z = 0; z < dz; z++) {
                    if (array[x][y][z] === 1) {
                        const worldPos = grid.gridToWorldPosition({ x, y, z });
                        
                        const block = isMoving
                            ? this.createMovingBlock(worldPos)
                            : this.createSettledBlock(worldPos, z);
                        
                        blocks.push(block);
                    }
                }
            }
        }

        return blocks;
    }
}

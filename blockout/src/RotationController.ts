import * as THREE from 'three';
import { Grid } from './Grid';
import type { GridIndex } from './Grid';

export class RotationController {
    private isRotating: boolean = false;
    private rotationProgress: number = 0;
    private readonly rotationDuration: number = 0.15;
    private rotationStartPositions: THREE.Vector3[] = [];
    private rotationTargetPositions: THREE.Vector3[] = [];

    public startRotation(
        axis: 'x' | 'y' | 'z',
        angle: number,
        objects: THREE.Object3D[],
        grid: Grid
    ): boolean {
        if (objects.length === 0 || this.isRotating) {
            return false;
        }

        this.rotationStartPositions = objects.map(obj => obj.position.clone());

        const gridPositions: GridIndex[] = [];
        for (const obj of objects) {
            const idx = grid.worldToGridIndex(obj.position);
            if (!idx) return false;
            gridPositions.push(idx);
        }

        const centerGrid = this.calculateCenter(gridPositions);
        const rotatedPositions = this.calculateRotatedPositions(gridPositions, centerGrid, axis, angle);

        if (!this.validateRotation(rotatedPositions, grid)) {
            return false;
        }

        this.rotationTargetPositions = rotatedPositions.map(pos => grid.gridToWorldPosition(pos));
        this.isRotating = true;
        this.rotationProgress = 0;
        return true;
    }

    public update(delta: number, objects: THREE.Object3D[]): void {
        if (!this.isRotating) return;

        this.rotationProgress += delta;
        const t = Math.min(this.rotationProgress / this.rotationDuration, 1.0);
        const eased = 1 - Math.pow(1 - t, 3);

        objects.forEach((obj, index) => {
            const startPos = this.rotationStartPositions[index];
            const targetPos = this.rotationTargetPositions[index];
            obj.position.lerpVectors(startPos, targetPos, eased);
        });

        if (t >= 1.0) {
            this.finishRotation(objects);
        }
    }

    public isActive(): boolean {
        return this.isRotating;
    }

    private finishRotation(objects: THREE.Object3D[]): void {
        objects.forEach((obj, index) => {
            obj.position.copy(this.rotationTargetPositions[index]);
        });
        this.isRotating = false;
        this.rotationProgress = 0;
        this.rotationStartPositions = [];
        this.rotationTargetPositions = [];
    }

    private calculateCenter(positions: GridIndex[]): GridIndex {
        const center = { x: 0, y: 0, z: 0 };
        positions.forEach(pos => {
            center.x += pos.x;
            center.y += pos.y;
            center.z += pos.z;
        });
        center.x /= positions.length;
        center.y /= positions.length;
        center.z /= positions.length;
        return center;
    }

    private calculateRotatedPositions(
        positions: GridIndex[],
        center: GridIndex,
        axis: 'x' | 'y' | 'z',
        angle: number
    ): GridIndex[] {
        const direction = angle > 0 ? 1 : -1;
        const rotated: GridIndex[] = [];

        for (const pos of positions) {
            const relX = pos.x - center.x;
            const relY = pos.y - center.y;
            const relZ = pos.z - center.z;

            let newRelX = relX, newRelY = relY, newRelZ = relZ;

            switch (axis) {
                case 'x':
                    newRelY = direction * relZ;
                    newRelZ = -direction * relY;
                    break;
                case 'y':
                    newRelX = -direction * relZ;
                    newRelZ = direction * relX;
                    break;
                case 'z':
                    newRelX = direction * relY;
                    newRelY = -direction * relX;
                    break;
            }

            rotated.push({
                x: Math.round(newRelX + center.x),
                y: Math.round(newRelY + center.y),
                z: Math.round(newRelZ + center.z)
            });
        }

        return rotated;
    }

    private validateRotation(positions: GridIndex[], grid: Grid): boolean {
        const positionSet = new Set<string>();

        for (const pos of positions) {
            if (!grid.isInBounds(pos.x, pos.y, pos.z)) {
                return false;
            }

            if (grid.isOccupied(pos.x, pos.y, pos.z)) {
                return false;
            }

            const key = `${pos.x},${pos.y},${pos.z}`;
            if (positionSet.has(key)) {
                return false;
            }
            positionSet.add(key);
        }

        return true;
    }
}

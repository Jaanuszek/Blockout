import * as THREE from 'three';

export default class Scene extends THREE.Scene {

    private readonly camera: THREE.PerspectiveCamera;
    private readonly objects: THREE.Object3D[] = [];    

    constructor(camera: THREE.PerspectiveCamera)
    {
        super();
        this.camera = camera;
    }

    init()
    {
        // const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
        // const points = [];
        // points.push(new THREE.Vector3(-5, 0, 0));
        // points.push(new THREE.Vector3(0, 5, 0));
        // points.push(new THREE.Vector3(5, 0, 0));
        // const geometry = new THREE.BufferGeometry().setFromPoints(points);
        // const line = new THREE.Line(geometry, material);
        // this.add(line);
        this.createMainScene(4, 4, 10);
        const axes = new THREE.AxesHelper(2);
        this.add(axes);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 4, 2);
        this.add(light);
    }

    update()
    {
        this.objects.forEach((obj) => {
            obj.rotation.x += 0.01;
            obj.rotation.y += 0.01;
        });
    }

    createMainScene(width: number, height: number, depth: number, cellSize: number = 1)
    {
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
        grid.position.set(
            - (width * cellSize) / 2,
            - (height * cellSize) / 2,
            - (depth * cellSize) / 2
        );
        this.add(grid);
    }

}
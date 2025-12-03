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
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.y = -1;
        this.add(cube);
        this.objects.push(cube);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 4, 2);

        this.add(light);

        this.createFloor(10, 10);

        const wall = this.createBlock(10, 3, 0.5, 0x777777);
        wall.position.set(0, 1.5, -5);
        this.add(wall);

        const platform = this.createBlock(2, 1, 2, 0xcccccc);
        platform.position.set(2, 0.5, 2);
        this.add(platform);

        const ramp = this.createRamp(4, 0.5, 2, -Math.PI / 6);
        ramp.position.set(-3, 0.25, 2);
        this.add(ramp);
    }

    update()
    {
        this.objects.forEach((obj) => {
            obj.rotation.x += 0.01;
            obj.rotation.y += 0.01;
        });
    }

    private createFloor(w: number, h: number)
    {
        const geometry = new THREE.PlaneGeometry(w, h);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = - Math.PI / 2;
        floor.position.y = -2;
        this.add(floor);
    }

    private createBlock(w: number, h: number, d: number, color = 0x999999)
    {
        const geometry = new THREE.BoxGeometry(w, h, d);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    private createRamp(w: number, h:number, d:number, angle: number)
    {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshBasicMaterial({ color: 0xbbbbbb });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.z = angle;
        return mesh;
    }
}
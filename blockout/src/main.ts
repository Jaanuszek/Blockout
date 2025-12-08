import * as THREE from 'three';
import Scene from './Scene';

const width = window.innerWidth;
const height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById('app') as HTMLCanvasElement 
});
renderer.setSize(width, height);

const mainCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
mainCamera.position.z = -10;
mainCamera.lookAt(0, 0, 0);

const scene = new Scene(mainCamera);
scene.init();


function tick()
{
  // scene.update();
  renderer.render(scene, mainCamera);
  requestAnimationFrame(tick);
}

tick();
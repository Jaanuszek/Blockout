import * as THREE from 'three';
import Scene from './Scene';
import Camera from './camera';
import { update } from 'three/examples/jsm/libs/tween.module.js';
import InputManager from './inputManager';

const width = window.innerWidth;
const height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById('app') as HTMLCanvasElement, 
  antialias: true
});
renderer.setSize(width, height);

const camera = new Camera(renderer, 75, 0.1, 1000);
const scene = new Scene(camera);

const inputManager = new InputManager(scene, camera);

scene.init();

const clock = new THREE.Clock();

function tick()
{
  const delta = clock.getDelta();
  (inputManager as any).update?.(delta);
  (camera as any).update?.(delta);
  // pass delta to scene update so animations progress
  (scene as any).update?.(delta);
  update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
import * as THREE from 'three';
import { update } from 'three/examples/jsm/libs/tween.module.js';
import Scene from './Scene';
import Camera from './camera';
import InputManager from './inputManager';

const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById('app') as HTMLCanvasElement, 
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);

const camera = new Camera(renderer, 75, 0.1, 1000);
const scene = new Scene(camera);
const inputManager = new InputManager(camera);

scene.init();

const clock = new THREE.Clock();

function tick() {
  const delta = clock.getDelta();
  inputManager.update(delta);
  scene.update(delta);
  update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
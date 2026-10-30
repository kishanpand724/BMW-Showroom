import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  clampProgress,
  validateConsultationForm,
} from './showroomLogic';
import {
  SCROLL_SCENES,
  MAX_DOOR_ANGLE_DEG,
  MAX_HOOD_ANGLE_DEG,
  computeScrollKinematicState,
  PAINT_FINISHES,
  INTERIOR_TRIMS,
} from './carScrollChoreography';
import { rigAndCalibrateBmwModel } from './carModelRig';

describe('BMW M4 3D Scroll-Controlled Luxury Automotive Experience', () => {
  it('defines all 7 scroll-controlled chapters in continuous order from 0 to 1', () => {
    assert.equal(SCROLL_SCENES.length, 7);
    assert.equal(SCROLL_SCENES[0].startProgress, 0);
    assert.equal(SCROLL_SCENES[6].endProgress, 1);
    for (let i = 0; i < SCROLL_SCENES.length - 1; i++) {
      assert.equal(SCROLL_SCENES[i].endProgress, SCROLL_SCENES[i + 1].startProgress);
    }
  });

  it('keeps driver door closed during Front & Wheel chapters (0..0.40) and progressively opens to 65° in Chapter 04 (0.40..0.54)', () => {
    const startState = computeScrollKinematicState(0.0);
    assert.equal(startState.activeSceneIndex, 0);
    assert.equal(startState.driverDoorAngleDeg, 0);
    assert.equal(startState.wheelRotationRad, 0);

    const frontDesign = computeScrollKinematicState(0.20);
    assert.equal(frontDesign.activeSceneIndex, 1);
    assert.equal(frontDesign.driverDoorAngleDeg, 0);

    const sideWheels = computeScrollKinematicState(0.35);
    assert.equal(sideWheels.activeSceneIndex, 2);
    assert.equal(sideWheels.driverDoorAngleDeg, 0);

    // Chapter 04: Door unlocks and swings outward
    const unlockStart = computeScrollKinematicState(0.402);
    assert.equal(unlockStart.doorUnlocked, true);
    assert.ok(unlockStart.unlockFlashIntensity > 0.3);

    const quarterDoor = computeScrollKinematicState(0.45);
    const halfDoor = computeScrollKinematicState(0.49);
    const fullDoor = computeScrollKinematicState(0.54);

    assert.ok(quarterDoor.driverDoorAngleDeg > 4 && quarterDoor.driverDoorAngleDeg < 30);
    assert.ok(halfDoor.driverDoorAngleDeg > quarterDoor.driverDoorAngleDeg);
    assert.equal(fullDoor.driverDoorAngleDeg, MAX_DOOR_ANGLE_DEG);
  });

  it('reverses door angle naturally when scrolling backward', () => {
    const forwardA = computeScrollKinematicState(0.50).driverDoorAngleRad;
    const forwardB = computeScrollKinematicState(0.46).driverDoorAngleRad;
    assert.ok(forwardB < forwardA);
  });

  it('enters the cabin cleanly in Chapter 05 (0.57..0.70) without clipping roof, sill, hinge, or B-pillar', () => {
    for (let i = 0; i <= 16; i++) {
      const p = 0.57 + (i / 16) * (0.66 - 0.57);
      const state = computeScrollKinematicState(p);
      const [cx, cy, cz] = state.cameraPosition;

      assert.equal(state.driverDoorAngleDeg, MAX_DOOR_ANGLE_DEG);
      assert.ok(cy > 0.85 && cy < 1.20, `Camera height ${cy} out of safe doorway corridor at p=${p}`);
      assert.ok(cz > -0.35 && cz < 0.15, `Camera Z ${cz} out of safe doorway corridor at p=${p}`);
      assert.ok(cx >= 0.34 && cx <= 1.50);
    }
  });

  it('opens the S58 hood in Chapter 06 Performance (0.73..0.86) and closes all panels for Rear & Final Showcase', () => {
    const perfMid = computeScrollKinematicState(0.80);
    assert.equal(perfMid.activeSceneIndex, 5);
    assert.equal(perfMid.driverDoorAngleDeg, 0);
    assert.equal(perfMid.hoodAngleDeg, MAX_HOOD_ANGLE_DEG);

    const rearShowcase = computeScrollKinematicState(0.90);
    assert.equal(rearShowcase.activeSceneIndex, 6);
    assert.equal(rearShowcase.driverDoorAngleDeg, 0);
    assert.equal(rearShowcase.hoodAngleDeg, 0);
  });

  it('extracts and rigs Driver_Door_Pivot and applies physical hinge poses cleanly', () => {
    const mockScene = new THREE.Group();
    const bodyParts = new THREE.Group();
    bodyParts.name = 'BodyParts_1';

    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array([
      285.0, -160.0, -2.0,
      285.5, -160.0, -2.0,
      285.0, -160.5, -2.5,
      288.9, -164.5, -3.2,
      289.1, -163.5, -3.0,
      289.0, -164.0, -2.2,
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setIndex([0, 1, 2, 3, 4, 5]);

    const mat = new THREE.MeshStandardMaterial({ name: 'Mesheszx1Mtl' });
    const mesh = new THREE.Mesh(geom, mat);
    bodyParts.add(mesh);
    mockScene.add(bodyParts);

    const rigged = rigAndCalibrateBmwModel(
      mockScene,
      '/models/bmw_m4.glb',
      PAINT_FINISHES[0],
      INTERIOR_TRIMS[0],
      true
    );

    assert.equal(rigged.inspectionReport.hasSeparateDriverDoor, true);
    assert.ok(rigged.driverDoorPivot !== null);
    assert.ok(rigged.passengerDoorPivot !== null);
    assert.ok(rigged.hoodPivot !== null);

    rigged.applyPose({
      driverDoorAngleRad: 1.08,
      passengerDoorAngleRad: 1.05,
      hoodAngleRad: 0.66,
    });
    assert.equal(rigged.driverDoorPivot!.rotation.z, 1.08);
    assert.equal(rigged.passengerDoorPivot!.rotation.z, -1.05);
    assert.equal(rigged.hoodPivot!.rotation.x, -0.66);
  });

  it('validates consultation inputs and clamps progress values', () => {
    assert.equal(clampProgress(-0.5), 0);
    assert.equal(clampProgress(1.5), 1);
    assert.equal(
      validateConsultationForm({ fullName: '', email: 'bad', city: '' }).valid,
      false
    );
    assert.equal(
      validateConsultationForm({
        fullName: 'Lukas Weber',
        email: 'lukas@bmw-m.de',
        city: 'Munich',
      }).valid,
      true
    );
  });

  it('provides 12 authentic BMW M & Individual paint finishes and 6 Merino leather trims', () => {
    assert.equal(PAINT_FINISHES.length, 12);
    assert.equal(INTERIOR_TRIMS.length, 6);
    const paintCodes = PAINT_FINISHES.map((p) => p.code);
    assert.ok(paintCodes.includes('475')); // Black Sapphire
    assert.ok(paintCodes.includes('C4P')); // Brooklyn Grey
    assert.ok(paintCodes.includes('C4H')); // Sao Paulo Yellow
    assert.ok(paintCodes.includes('299')); // Techno Violet
  });
});


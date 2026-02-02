let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Constraint = Matter.Constraint,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint;

let engine, world, mConstraint;
let noodles = [];
let smoothPositions = [];
let cnv;
let pane;

let params = {
  width: 1080,
  height: 1920,
  numNoodles: 70,
  noodleLength: 20,
  noodleThickness: 3,
  spacing: 8,
  gravity: { x: 0, y: 1 },
  frictionAir: 0.02,
  restitution: 0.001,
  friction: 0.2,
  stiffness: 0.55,
  damping: 0.05,
  smoothing: 0.3,
  spawnRadius: 150,
  mouseStiffness: 0.2
};

function setup() {
  cnv = createCanvas(params.width, params.height);
  const holder = document.getElementById('canvas-container');
  if (holder && cnv) cnv.parent('canvas-container');
  
  engine = Engine.create();
  world = engine.world;
  world.gravity.x = params.gravity.x;
  world.gravity.y = params.gravity.y;

  setupWalls();
  createNoodles();

  const mouse = Mouse.create(cnv.elt);
  const options = {
    mouse: mouse,
    constraint: {
      stiffness: params.mouseStiffness,
      render: { visible: false }
    }
  };
  mConstraint = MouseConstraint.create(engine, options);
  World.add(world, mConstraint);

  setupTweakpane();
}

function setupWalls() {
  const wallThickness = 200;
  
  // Create walls at canvas boundaries
  let top = Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, {
    isStatic: true,
    restitution: params.restitution,
    friction: params.friction
  });

  let bottom = Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
    isStatic: true,
    restitution: params.restitution,
    friction: params.friction
  });

  let left = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
    isStatic: true,
    restitution: params.restitution,
    friction: params.friction
  });

  let right = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, {
    isStatic: true,
    restitution: params.restitution,
    friction: params.friction
  });

  World.add(world, [top, bottom, left, right]);
}

function createNoodles() {
  noodles = [];
  smoothPositions = [];

  const centerX = width / 2;
  const centerY = height / 2;
  const boxSize = params.spawnRadius * 2;

  for (let w = 0; w < params.numNoodles; w++) {
    let noodle = [];
    
    // Spawn in a random box pattern from center
    let noodleTotalLength = (params.noodleLength - 1) * params.spacing;
    let startX = centerX + random(-boxSize / 2, boxSize / 2) - noodleTotalLength / 2;
    let startY = centerY + random(-boxSize / 2, boxSize / 2);
    let prev = null;

    for (let i = 0; i < params.noodleLength; i++) {
      let x = startX + i * params.spacing;
      let y = startY;
      
      let body = Bodies.circle(x, y, 5, {
        frictionAir: params.frictionAir,
        restitution: params.restitution,
        friction: params.friction,
      });
      World.add(world, body);
      noodle.push(body);

      if (prev) {
        let link = Constraint.create({
          bodyA: prev,
          bodyB: body,
          length: params.spacing,
          stiffness: params.stiffness,
          damping: params.damping
        });
        World.add(world, link);
      }
      prev = body;
    }

    noodles.push(noodle);
    smoothPositions.push(noodle.map(b => createVector(b.position.x, b.position.y)));
  }
}

function adjustNoodleLength() {
  // Adjust length of all existing noodles
  for (let n = 0; n < noodles.length; n++) {
    let noodle = noodles[n];
    const currentLength = noodle.length;
    const targetLength = params.noodleLength;
    
    if (targetLength > currentLength) {
      // Add segments to this noodle
      let lastBody = noodle[noodle.length - 1];
      
      for (let i = currentLength; i < targetLength; i++) {
        let x = lastBody.position.x + params.spacing;
        let y = lastBody.position.y;
        
        let body = Bodies.circle(x, y, 5, {
          frictionAir: params.frictionAir,
          restitution: params.restitution,
          friction: params.friction,
        });
        World.add(world, body);
        noodle.push(body);
        smoothPositions[n].push(createVector(x, y));
        
        let link = Constraint.create({
          bodyA: lastBody,
          bodyB: body,
          length: params.spacing,
          stiffness: params.stiffness,
          damping: params.damping
        });
        World.add(world, link);
        lastBody = body;
      }
    } else if (targetLength < currentLength) {
      // Remove segments from this noodle
      for (let i = currentLength - 1; i >= targetLength; i--) {
        let bodyToRemove = noodle[i];
        
        // Remove all constraints connected to this body
        let constraintsToRemove = world.constraints.filter(c => 
          c.bodyA === bodyToRemove || c.bodyB === bodyToRemove
        );
        for (let constraint of constraintsToRemove) {
          World.remove(world, constraint);
        }
        
        // Remove the body itself
        World.remove(world, bodyToRemove);
        noodle.pop();
        smoothPositions[n].pop();
      }
    }
  }
}

function adjustNoodleSpacing() {
  // Update constraint lengths for all noodles
  for (let constraint of world.constraints) {
    if (constraint.bodyA && constraint.bodyB) {
      constraint.length = params.spacing;
    }
  }
}

function adjustNoodleCount() {
  const currentCount = noodles.length;
  const targetCount = params.numNoodles;
  
  if (targetCount > currentCount) {
    // Add new noodles
    const centerX = width / 2;
    const centerY = height / 2;
    const boxSize = params.spawnRadius * 2;
    
    for (let w = currentCount; w < targetCount; w++) {
      let noodle = [];
      
      // Spawn in a random box pattern from center
      let noodleTotalLength = (params.noodleLength - 1) * params.spacing;
      let startX = centerX + random(-boxSize / 2, boxSize / 2) - noodleTotalLength / 2;
      let startY = centerY + random(-boxSize / 2, boxSize / 2);
      let prev = null;

      for (let i = 0; i < params.noodleLength; i++) {
        let x = startX + i * params.spacing;
        let y = startY;
        
        let body = Bodies.circle(x, y, 5, {
          frictionAir: params.frictionAir,
          restitution: params.restitution,
          friction: params.friction,
        });
        World.add(world, body);
        noodle.push(body);

        if (prev) {
          let link = Constraint.create({
            bodyA: prev,
            bodyB: body,
            length: params.spacing,
            stiffness: params.stiffness,
            damping: params.damping
          });
          World.add(world, link);
        }
        prev = body;
      }

      noodles.push(noodle);
      smoothPositions.push(noodle.map(b => createVector(b.position.x, b.position.y)));
    }
  } else if (targetCount < currentCount) {
    // Remove excess noodles
    for (let w = currentCount - 1; w >= targetCount; w--) {
      let noodle = noodles[w];
      for (let body of noodle) {
        World.remove(world, body);
      }
      noodles.pop();
      smoothPositions.pop();
    }
  }
}

function resetSimulation() {
  World.clear(world, false);
  Engine.clear(engine);
  world.gravity.x = params.gravity.x;
  world.gravity.y = params.gravity.y;
  setupWalls();
  createNoodles();
  
  const mouse = Mouse.create(cnv.elt);
  const options = {
    mouse: mouse,
    constraint: {
      stiffness: params.mouseStiffness,
      render: { visible: false }
    }
  };
  mConstraint = MouseConstraint.create(engine, options);
  World.add(world, mConstraint);
}

function draw() {
  background(0);
  Engine.update(engine);

  for (let n = 0; n < noodles.length; n++) {
    let noodle = noodles[n];
    let smooth = smoothPositions[n];

    stroke(255);
    strokeWeight(params.noodleThickness);
    strokeCap(ROUND);
    noFill();
    beginShape();

    for (let i = 0; i < noodle.length; i++) {
      let target = noodle[i].position;
      smooth[i].x = ease(smooth[i].x, target.x, params.smoothing);
      smooth[i].y = ease(smooth[i].y, target.y, params.smoothing);
      curveVertex(smooth[i].x, smooth[i].y);
    }
    endShape();
  }

  if (mConstraint && mConstraint.body) {
    let pos = mConstraint.body.position;
    fill(255, 150);
    noStroke();
    ellipse(pos.x, pos.y, 20);
  }

  if (window.mb && window.mb.isRecording && window.mb.isRecording()) {
    window.mb.addFrame().catch(err => console.error('Frame recording error:', err));
  }
}


function ease(current, target, amt) {
  return current + (target - current) * amt;
}

function setupTweakpane() {
  if (typeof window.Tweakpane === 'undefined' || !window.Tweakpane.Pane) {
    console.error('Tweakpane not loaded');
    setTimeout(setupTweakpane, 100);
    return;
  }

  pane = new window.Tweakpane.Pane({ title: 'Noodle Controls' });

  const resolutionFolder = pane.addFolder({ title: 'Resolution', expanded: false });
  resolutionFolder.addBinding(params, 'width', { label: 'Width', view: 'text' }).on('change', () => {
    resizeCanvas(params.width, params.height);
    const container = document.getElementById('canvas-container');
    if (container) {
      container.style.aspectRatio = `${params.width} / ${params.height}`;
    }
    resetSimulation();
  });
  resolutionFolder.addBinding(params, 'height', { label: 'Height', view: 'text' }).on('change', () => {
    resizeCanvas(params.width, params.height);
    const container = document.getElementById('canvas-container');
    if (container) {
      container.style.aspectRatio = `${params.width} / ${params.height}`;
    }
    resetSimulation();
  });

  const noodleFolder = pane.addFolder({ title: 'Noodles', expanded: true });
  noodleFolder.addBinding(params, 'numNoodles', { min: 1, max: 100, step: 1, label: 'Count' }).on('change', adjustNoodleCount);
  noodleFolder.addBinding(params, 'noodleLength', { min: 10, max: 50, step: 1, label: 'Length' }).on('change', adjustNoodleLength);
  noodleFolder.addBinding(params, 'noodleThickness', { min: 1, max: 10, step: 0.5, label: 'Thickness' });
  noodleFolder.addBinding(params, 'spacing', { min: 1, max: 30, step: 0.5, label: 'Spacing' }).on('change', adjustNoodleSpacing);

  const physicsFolder = pane.addFolder({ title: 'Physics', expanded: true, expanded: true });
  
  // Gravity 2D control - always expanded
  physicsFolder.addBinding(params, 'gravity', {
    x: { min: -2, max: 2, step: 0.1 },
    y: { min: -2, max: 2, step: 0.1 },
    label: 'Gravity',
    picker: 'inline',
    expanded: true
  }).on('change', () => {
    world.gravity.x = params.gravity.x;
    world.gravity.y = params.gravity.y;
  });
  
  physicsFolder.addBinding(params, 'frictionAir', { min: 0, max: 0.1, step: 0.001, label: 'Air Friction' });
  physicsFolder.addBinding(params, 'restitution', { min: 0, max: 1, step: 0.01, label: 'Bounce' });
  physicsFolder.addBinding(params, 'friction', { min: 0, max: 1, step: 0.01, label: 'Friction' });
  physicsFolder.addBinding(params, 'stiffness', { min: 0, max: 1, step: 0.01, label: 'Stiffness' });
  physicsFolder.addBinding(params, 'damping', { min: 0, max: 0.5, step: 0.01, label: 'Damping' });

  const visualFolder = pane.addFolder({ title: 'Visual', expanded: true });
  visualFolder.addBinding(params, 'smoothing', { min: 0, max: 1, step: 0.01, label: 'Smoothing' });

  const spawnFolder = pane.addFolder({ title: 'Spawn', expanded: false });
  spawnFolder.addBinding(params, 'spawnRadius', { min: 0, max: 500, step: 10, label: 'Radius' });

  // const interactionFolder = pane.addFolder({ title: 'Interaction', expanded: false });
  // interactionFolder.addBinding(params, 'mouseStiffness', { min: 0, max: 1, step: 0.01, label: 'Mouse Stiffness' });

  const controlsFolder = pane.addFolder({ title: 'Controls', expanded: true });
  controlsFolder.addButton({ title: 'Reset Simulation' }).on('click', resetSimulation);

  const recordingFolder = pane.addFolder({ title: 'Recording', expanded: true });
  const recordBtn = recordingFolder.addButton({ title: 'Start Recording' });
  
  recordBtn.on('click', async () => {
    if (!window.mb) {
      alert('Mediabunny not loaded. Check console.');
      return;
    }

    const isRec = window.mb.isRecording();

    if (isRec) {
      recordBtn.title = 'Finalizing...';
      try {
        const result = await window.mb.stopRecording();
        if (result && result.blob) {
          const url = URL.createObjectURL(result.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `noodle-animation-${Date.now()}.mp4`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          console.log('Recording complete!');
        }
      } catch (e) {
        console.error('Failed to stop recording:', e);
        alert('Failed to stop recording: ' + e.message);
      } finally {
        recordBtn.title = 'Start Recording';
      }
    } else {
      recordBtn.title = 'Starting...';
      try {
        await window.mb.startRecording(cnv.canvas, {
          format: 'mp4',
          fps: 60,
          width: params.width,
          height: params.height,
          bitrate: 50000000
        });
        recordBtn.title = 'Stop Recording';
      } catch (e) {
        console.error('Failed to start recording:', e);
        alert('Failed to start recording: ' + e.message);
        recordBtn.title = 'Start Recording';
      }
    }
  });
}

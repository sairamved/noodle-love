# noodle-love

physics-based noodle simulator with real-time controls. drag noodles around by changing the direction of gravity.

This was created to collaborate with [Vishav Arora](https://www.instagram.com/its.vishav/) on [Project Heart 2026](https://projectheart.in/).

## params

**resolution**
- `width` - canvas width (default: 1080)
- `height` - canvas height (default: 1920)

**noodles**
- `numNoodles` - how many noodles (1-100, default: 70)
- `noodleLength` - segments per noodle (10-50, default: 20)
- `noodleThickness` - stroke thickness (1-10, default: 3)
- `spacing` - distance between segments (1-30, default: 8)

**physics**
- `gravity` - x/y gravity (-2 to 2, default: {x: 0, y: 1})
- `frictionAir` - air resistance (0-0.1, default: 0.02)
- `restitution` - bounciness (0-1, default: 0.001)
- `friction` - surface friction (0-1, default: 0.2)
- `stiffness` - constraint stiffness (0-1, default: 0.55)
- `damping` - constraint damping (0-0.5, default: 0.05)

**visual**
- `smoothing` - motion smoothing (0-1, default: 0.3)

**spawn**
- `spawnRadius` - spawn area size (0-500, default: 150)

## recording
hit the "Start Recording" button to capture mp4 video at 60fps. recordings auto-download when you stop.

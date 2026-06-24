# Avatar GLB location

The portfolio loads a rigged full-body avatar from:

```text
static/models/ravali-avatar.glb
```
The current implementation intentionally builds a premium Three.js 3D
avatar rig at runtime so the portfolio does not display the older toy-like GLB.
A production GLB can still replace the procedural rig when it meets the export requirements below.
The procedural rig uses separate head, torso, arms, hands, legs, hair, eyes,
smile, blazer, trousers, and sneaker meshes so JavaScript can animate natural
breathing, blinking, greeting waves, listening nods, pointing, hand gestures,
and speech mouth movement.
Export requirements for a replacement production GLB:
- One full-body South Indian female 3D avatar only.
- Proportions: head 20%, torso 40%, legs 40%, with the body as the focus.
- Long black wavy hair, natural eyebrows, warm smile, large expressive eyes,
  and a professional look.
- No earrings and no jewelry.
- Black blazer, black round-neck top, black fitted trousers, and white sneakers.
- Rigged full body with blendshapes/morph targets for blinking and
  mouth/visemes.
- Optional animation clips named like `Idle`, `Wave`, `Talk`, `Point`, and
  `Listen`.
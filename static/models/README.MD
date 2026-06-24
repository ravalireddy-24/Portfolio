window.addEventListener("resize", resizeAvatar);
window.addEventListener("beforeunload", () => { recognition?.abort(); window.speechSynthesis?.cancel(); });
window.addEventListener("scroll", () => { if (currentState === "pointing") assistantPanel.removeAttribute("style"); }, { passive: true });
window.addEventListener("load", () => setTimeout(() => { if (!hasGreeted) greet(); }, 650));

resizeAvatar();
loadAvatar();
requestAnimationFrame(animate);# Avatar GLB location

Place the single rigged full-body avatar file here:

```text
static/models/ravali-avatar.glb
```

Export requirements:
- One female Indian/South Asian 3D cartoon avatar only.
- Long black wavy hair, soft smile, professional look.
- No earrings and no jewelry.
- Black blazer, black top, black trousers, white sneakers.
- Rigged full body with blendshapes/morph targets for blinking and mouth/visemes.
- Optional animation clips named like `Idle`, `Wave`, `Talk`, `Point`, and `Listen`.

The portfolio code loads this exact GLB path and drives blinking, waving, nodding,
listening, pointing, hand movement, and speech mouth movement with JavaScript.
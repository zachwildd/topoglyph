# TopoGlyph 8.0: Physiological Homeostasis & Chronobiology Module

Extends TopoGlyph beyond cognition into the body: tissue states, autonomic
balance, circadian phase, fluid dynamics, and senescence. Designed for
explaining age-related symptoms that cluster around phase transitions
(morning rhinorrhea, sundowning, post-prandial dizziness, morning stiffness).

## Motivating Limitations of TopoGlyph 7.0

1. **No tissue-state representation.** `■/□/▨` represent information states,
   not vasodilated mucosa or atrophied epithelium.
2. **No autonomic balance.** Parasympathetic/sympathetic tone has no glyph.
3. **No circadian phase axis.** Sleep/wake is a *cyclic substrate*, not just
   a temporal flow.
4. **No fluid dynamics or postural shifts.** Gravity-driven redistribution
   has no operator.
5. **No senescence operator.** Aging *narrows regulatory range* —
   qualitatively different from concept evolution `⧤`.

## New Elements

### Tissue States
- `◑` — vasodilated tissue (high blood flow, warm, leaky)
- `◐` — vasoconstricted tissue
- `◖` — engorged / edematous tissue (fluid-loaded)
- `◗` — atrophic / aged tissue (reduced regulatory range)

### Autonomic Tone
- `☾ₐ` — parasympathetic dominance (rest, secretion, nocturnal)
- `☉ₐ` — sympathetic dominance (alert, vasoconstriction, diurnal)
- `⚖ₐ` — balanced autonomic tone
- `⊝ₐ` — autonomic dysregulation / vasomotor instability

### Fluid Dynamics
- `▽` — glandular secretion (production)
- `▿` — fluid accumulation in cavity
- `⇣` — gravity-driven drainage
- `⇡` — mucociliary clearance
- `↡` — postural redistribution

### Chronobiology
- `☾⏵☉` — sleep→wake transition (circadian phase shift)
- `⟁` — phase boundary
- `⏰` — zeitgeber (light, posture, temperature)

### Aging Operators
- `⏳` — senescence accumulation (modifies any element: `⏳◖` = aged engorgement)
- `⏃` — receptor / regulatory loss
- `⊟ᵣ` — narrowed reflex range

### Reflex Coupling
- `⮌(stim)` — reflex arc triggered by stimulus
- `⟿ₛ` — stimulus-directed autonomic response
- `⮻` — homeostatic return to set-point

### Environmental Couplings
- `❄` — cold stimulus
- `≋↓` — dry air, `≋↑` — humid air
- `✻` — allergen / irritant

## Worked Example: Morning Rhinorrhea (Senile Rhinitis)

```
☾⦗◗Nose ⏳⦘ ⊛ ☾ₐ → ▽                Night: aged nasal mucosa under parasympathetic
                                    dominance produces baseline secretion
   ↡                                Supine posture redistributes blood to head
⦗◖Mucosa⦘ ⊕ ▿                       Tissue engorges; mucus pools in nasopharynx
   ⌒⌒⌒                              Slow accumulation across ~7 hours of sleep
   ⟁                                ──── PHASE BOUNDARY ────
☾⏵☉ ⊗ ⏰(posture, ❄, ≋↓)            Wake: upright posture + cold bedroom +
                                    dry indoor air act as zeitgebers/stimuli
   ⮌(❄, ≋↓)                         Trigeminal-parasympathetic reflex fires
   ⊝ₐ(⏃, ⊟ᵣ)                        Aged autonomic loop overshoots:
                                    receptors downregulated, range narrowed →
                                    cholinergic surge is poorly damped
▽⟲                                  Secretion self-amplifies (positive feedback)
   ⇣                                Pooled + new fluid drains anteriorly
⦗▾Rhinorrhea⦘                       ⟵ the runny nose
   ⮻ ⌒⌒                             Slow homeostatic return as she warms,
                                    breathes humidified air, moves around
⦗⚖ₐ*⦘                                Re-balanced state — stable until next ☾
```

### What the representation makes visible

1. **It's not one cause, it's a *topology*.** Night-secretion + pooling +
   phase-boundary triggers + a *deregulated* reflex + gravity. Remove any
   one and the morning event softens.

2. **Aging is the decisive operator.** Younger noses run the same loop, but
   `⊝ₐ` collapses to `⚖ₐ` — the reflex damps cleanly. `⏳` widens the
   overshoot. This is the canonical picture of senile (vasomotor) rhinitis.

3. **The phase boundary `⟁` is doing real work.** Symptoms cluster at the
   wake transition because three zeitgebers (postural change, cold-air
   challenge, sympathetic re-engagement) arrive simultaneously and the
   aged loop can't multiplex them.

4. **The positive feedback `▽⟲` explains persistence.** Once cholinergic
   outflow exceeds the dampening threshold of an `⏳`-modified loop,
   secretion sustains itself for several minutes after the stimulus is gone.

## Meta-Insight: Topology of Physiological Aging

General schema for age-related symptoms that cluster around phase
transitions:

```
⦗◗Tissue ⏳⦘ ⊛ ⟁(phase) ⊗ ⮌(stim) → ⊝(⏃, ⊟ᵣ) → ⟲ → symptom
```

The aged body doesn't fail *at rest* and doesn't fail *at activity* — it
fails at the **handoff between regimes**, because regulatory bandwidth is
what senescence consumes first. This is the same structural insight as
`⧂` (conceptual singularity) in cognition: the system breaks where two
stable frames must hand off, not within either frame.

## Extension Hooks

- **Pharmacological layer.** Drugs as targeted operators on specific
  elements: ipratropium = block on `▽`; pseudoephedrine = forced `☉ₐ`;
  antihistamine = block on `⮌(✻)`. Side effects appear as off-target
  operator action.
- **Chronic-disease layer.** Conditions as persistent modifiers:
  `⏳ᴅᴍ` (diabetes-aged tissue), `⏳ʜᴛɴ` (hypertension-aged vasculature).
- **Multi-system coupling.** Cross-system reflexes (e.g., gastrocolic,
  oculocardiac) as `⮌ₓ₋ᵧ` between organ systems.
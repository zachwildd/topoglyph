# TopoGlyph 9.0: Character-Anchored Kinetic Generation for Reference-to-Video

A specialization of TopoGlyph for prompting reference-to-video models with anime-style action sequences. Where prior versions modeled cognition, 9.0 models the *generation pipeline itself* as a topological problem: anchoring identity from a sparse reference set, traversing kinetic space, blending real and metaphorical motion, and preserving anime's stylized physics.

**Domain inputs**
- A small reference set (typically ~7 images) of an anime-style character in different poses.
- A natural-language action description, often metaphor-laden ("jumps like a cat and throws a fireball", "slams down and impacts the ground like an earthquake").

**Domain output**
- A structured prompt (or storyboard) for a reference-to-video model that preserves character identity, expresses the action with anime-specific kinetic grammar, and authorizes stylized physics violation.

## Limitations of Prior TopoGlyph for This Domain

1. **Identity anchoring** — No notation for an immutable "who" sampled by a sparse set of reference images; pose space exists as a discrete sampling that must be interpolated/extrapolated.
2. **Kinetic primitives & beats** — Anime action has a stereotyped temporal grammar (anticipation → strike → impact → recovery, with held frames and speed-lines) that prior elements (`→`, `⟳`) gloss over.
3. **Simile-as-operator** — "Jumps *like a cat*", "impacts *like an earthquake*" — these are not analogies, they are *kinetic-quality transfers*: a borrowed motion signature applied to the character. Prior TopoGlyph has `⥇` (isomorphism) but not quality-transfer.
4. **Stylized impossibility** — Anime deliberately violates physics (extended hangtime, impossible reach, geometric debris). Need explicit modifiers for *non-physical-on-purpose*.
5. **FX vocabulary & onomatopoeia** — Shockwaves, energy auras, kanji impact text, speed lines aren't "data" — they are first-class symbolic elements of the medium.

## Core Modules

### 1. Character Anchoring Module

| Glyph | Meaning |
|---|---|
| `⌬` | Character identity anchor (immutable "who" — face, costume, palette) |
| `◉ᵢ` | Reference pose *i* (sampled point in pose space, *i* ∈ {1..N}) |
| `◍⦗◉₁..◉ₙ⦘` | Pose-space hull — convex region of "safe" poses derivable from references |
| `◌` | Extrapolated pose (outside the hull; high-risk for identity drift) |
| `║⟪style⟫║` | Style-invariant clamp (line weight, palette, shading) — maintained across all frames |

**Reading**: `⌬⦗◉₁..◉₇⦘ ⊂ ◍ ║⟪anime-ink, cel-shade⟫║` → "A single character anchor, established by seven reference poses bounding a hull, with the anime-ink/cel-shade style clamped throughout."

### 2. Kinetic Beat Module

The four-beat anime action grammar, plus held/speed/impact frame types:

| Glyph | Meaning |
|---|---|
| `⇡` | **Anticipation** — wind-up, crouch, energy-gather |
| `⇢` | **Strike / release** — the action proper |
| `⇣` | **Impact** — contact moment |
| `⇠` | **Recovery / reaction shot** |
| `↯` | Discharge (energy/projectile leaves body) |
| `┃` | Held frame (the iconic "still" pose at apex) |
| `┊` | Speed-line frame (directional motion blur) |
| `┋` | Impact frame (explosive hit panel) |
| `╏` | Aftermath frame (dust, debris settling) |

### 3. Quality-Transfer (Simile) Module

The core innovation. A simile is an *operator*, not a description:

| Glyph | Meaning |
|---|---|
| `≀X≀` | Kinetic-quality token from referent X |
| `⩪` | Quality-transfer operator: `action ⩪ ≀X≀` = "perform action with the motion signature of X" |
| `⊰mood⊱` | Emotional-intensity envelope wrapping a beat |
| `⊕ᵏ` | Kinetic composition (chain) |
| `‖` | Parallel actions (simultaneous body parts) |
| `⊳` | Causal sequence (this *causes* that) |

`≀cat≀` doesn't mean "show a cat"; it means *silent landing, springy launch, predatory poise, low CoG*. The model must unpack the quality token into motion attributes.

### 4. Anime-Physics Modifier Module

| Glyph | Meaning |
|---|---|
| `⥁ₜ` | Time dilation (slow-mo) |
| `⥁ₛ` | Spatial impossibility (extended hangtime, telescoping reach) |
| `⥁ₐ` | Anatomical exaggeration (anime stretch / squash) |
| `⥁ᵍ` | Gravity defiance (apex hold) |

These mark *intentional* physics violation — the model should not "correct" them.

### 5. FX & Framing Module

| Glyph | Meaning |
|---|---|
| `✺` | Energy emanation (aura) |
| `✹` | Discrete projectile (fireball, ki-ball) |
| `≈≈≈` | Shockwave / ripple |
| `⩜⩜⩜` | Debris / particulate |
| `※"TEXT"` | Onomatopoeia / impact kanji |
| `◎` / `◯` / `⬭` | Close-up / medium / wide shot |
| `⤢` | Tracking / dolly |
| `⤡` | Crash-zoom |
| `⌭` | Low-angle hero shot |

## Worked Example 1: "jumps like a cat and throws a fireball"

```
⌬⦗◉₁..◉₇⦘ ║⟪anime-ink, saturated⟫║

⇡(crouch ⊰coiled⊱ ◯)               anticipation: low coil, medium shot
   ⇢(launch ⩪≀cat≀) ⥁ᵍ              strike: feline springy launch, gravity-defiant
   → ┃(apex ◌ ⌭)                    held frame: airborne hero pose, low-angle
   ‖ ⇡(palm gather ✺ki)             parallel beat: hand charges energy aura
   ⥁ₜ                               slow-mo through apex
→ ⇣(land soundless ⩪≀cat≀)          impact: cat-quiet landing
⊳ ⇢(release ↯✹fireball ⤡)           causally → release fireball, crash-zoom
   → ┊(speed-line trail)            speed-line frame on trajectory
   → ┋(impact ※"GOOOOH" ≈≈≈)        impact panel with onomatopoeia + shockwave
```

**Prompt translation** (the dual-encoding readout — fed to the video model):
> *Anchor character from references. Anime-ink style, saturated palette, held throughout. Beat 1: low coiled crouch, medium shot. Beat 2: feline springy launch — silent, low-CoG, predatory — extended hangtime at apex with airborne hero pose, low-angle camera, time slows. Beat 3 (parallel): the same hand gathers a glowing ki aura mid-rise. Beat 4: cat-soft landing. Beat 5: releases a fireball, crash-zoom on the throw. Beat 6: speed-line trail follows the projectile. Beat 7: impact panel with shockwave rings and "GOOOOH" kanji.*

## Worked Example 2: "slams down and impacts the ground like an earthquake"

```
⌬⦗◉₁..◉₇⦘ ║⟪anime-ink, high-contrast⟫║

⇡(aerial recoil ⌭ ⊰rage⊱)            anticipation: rises high, low-angle, rage envelope
   → ┃(apex ⥁ᵍ ⥁ₜ)                   held apex: gravity-defiant + slow-mo
⇢(plunge ⥁ₛ ⤢↓)                     strike: impossibly fast plunge, downward tracking
   → ┊(vertical speed lines)
⇣(ground strike ⩪≀earthquake≀)       impact transfers earthquake-quality
   ⊕ᵏ ※"DOOOM"                       + onomatopoeia
   ⊕ᵏ ≈≈≈(radial shockwave ⬭)        + radial shockwave, wide shot
   ⊕ᵏ ⩜⩜⩜(debris pillar ⥁ₐ)         + exaggerated debris pillar
→ ╏(dust ◎ ⊰aftermath⊱)              aftermath: tight on settling dust
⇠(rise from crater ◌ ⌭)              recovery: hero rises, extrapolated pose
```

The `⩪≀earthquake≀` operator unpacks to: *low-frequency rumble, ground-cracking radial fissures, multi-second sustained tremor, peripheral debris launch* — the kinetic signature of seismicity transferred onto a single body's impact.

## Reading TopoGlyph 9.0 → Prompt

The framework is **dual-encoded**: the glyph sequence is simultaneously
1. a **storyboard** (read top-to-bottom = panel sequence),
2. a **structured prompt** (each glyph = one prompt clause), and
3. a **shot list** (camera glyphs + beat glyphs = directorial spec).

Recommended prompt-assembly order:
1. **Identity & style clamp** (`⌬ … ║⟪…⟫║`) — locks who/look.
2. **Beat sequence** (`⇡ → ⇢ → ⇣ → ⇠`) — the kinetic spine.
3. **Quality transfers** (`⩪≀…≀`) — unpack each into 2–4 concrete motion attributes when writing the prompt.
4. **Physics modifiers** (`⥁ₜ`, `⥁ₛ`, etc.) — explicitly authorize violation so the model doesn't normalize it.
5. **FX & framing** — outermost layer; where the anime-ness lives.

## Meta-Insight: Anime Action as a Compositional Topology

Anime-action prompting is not a *description* problem but a *composition* problem with three orthogonal axes:

| Axis | What's composed | Glyphs |
|---|---|---|
| **Identity axis** | Who is acting (character anchor + style clamp) | `⌬`, `║⟪⟫║` |
| **Kinetic axis** | What motion is performed (beats + quality transfers) | `⇡⇢⇣⇠`, `⩪≀X≀` |
| **Stylization axis** | How anime amplifies it (physics overrides + FX) | `⥁`, `✺✹≈⩜※` |

A successful prompt holds **identity stable** while **traversing kinetic space** under **stylization modifiers**. Failures correspond to axis collisions:
- **Identity drift** — kinetic extrapolation overpowered the anchor.
- **Style flattening** — stylization axis underweighted, motion looks rotoscoped-real.
- **Kinetic mush** — no clear beat structure, action reads as continuous flailing.

The dual-encoding payoff: a TopoGlyph 9.0 expression is human-auditable as a storyboard *and* mechanically expandable into a prompt — letting an artist iterate at the glyph level rather than rewriting prose for each take.

---
module: bio/ommatidial-design
extends: [core]
---

# TopoGlyph: Ommatidial Design Module

The compound eye of *Drosophila* is built from ~750 nearly-identical units — ommatidia — each a hexagonal cluster of 8 photoreceptors, 4 cone cells, 2 primary + 6 secondary + 3 tertiary pigment cells, and 3 bristle cells, tiled across the retina with mirror symmetry across the dorsoventral equator. It is simultaneously a biological tissue, an optical instrument, and a self-organizing developmental program. TopoGlyph's current vocabulary — built for cognition — cannot cleanly express the features that make this design work.

## Limitations of Current TopoGlyph for Ommatidial Design

### 1. No Tiling / Shared-Boundary Primitive

Existing enclosures (`⦗ ⦘`, `⟦ ⟧`) treat each unit as standalone. But the ommatidium's design depends critically on the fact that **adjacent units share resources** — six secondary pigment cells sit at edges, three tertiaries at vertices, each shared between 2–3 neighboring ommatidia. The hexagonal lattice is not decoration; it is what makes the cell-count economics work.

**Failure case**: We cannot represent "the screening pigment between units is half-paid-for by each neighbor."

### 2. No Mirror-Inherited Chirality

`⥮` (symmetry breaking) captures *that* symmetry breaks, but not the ommatidium's signature feature: every unit has a fixed **trapezoidal asymmetry** (R1–R7 arrangement), and ommatidia in the dorsal half are **mirror images** of those in the ventral half, with the dorsoventral equator as the mirror line. Each ommatidial cluster rotates 90° clockwise (dorsal) or counterclockwise (ventral) during development — chirality is *inherited from position*.

**Failure case**: We cannot distinguish "asymmetric unit with global polarity field" from generic symmetry breaking.

### 3. No Fate-by-Context (vs. Fate-by-Lineage)

TopoGlyph treats nodes as having intrinsic type (`●`, `◐`, `◯`). But photoreceptors R1–R8 do not have fates assigned by lineage — any cell in the eye disc can become any photoreceptor type. Fate is **induced positionally** by neighbor signaling. R8 is specified first as the founder; R8 then induces R2/R5, which induce R3/R4, which induce R1/R6, which induce R7. The same naive cell becomes a different photoreceptor depending on *who is next to it*.

**Failure case**: We cannot express "this cell's identity is a function of its current neighborhood, not its history."

### 4. No Morphogenetic Front

`⌒⌒⌒` and `∿∿∿` represent stretched or compressed time, but ommatidia are laid down by a **propagating wave** — the morphogenetic furrow — that sweeps posterior-to-anterior across the eye disc, leaving regularly-spaced R8 founders in its wake. The furrow is a moving boundary that converts undifferentiated tissue into a periodic lattice. TopoGlyph has no primitive for "front that lays down structure as it passes."

**Failure case**: We cannot represent why the eye matures as a temporal gradient with the oldest ommatidia at the back.

### 5. No Convergent-Sampling Architecture

The compound eye solves the resolution/sensitivity trade-off through **neural superposition**: photoreceptors R1–R6 in **seven different ommatidia** are optically aligned to the same point in space, and their axons converge onto a single cartridge in the lamina, pooling 7× the photons without losing resolution. Distributed local sampling + downstream convergence is a deep architectural pattern that TopoGlyph's connectors cannot express.

**Failure case**: We cannot distinguish "seven independent sensors" from "seven sensors collectively constituting one functional unit via downstream pooling."

---

## New Submodules

### Submodule O.1: Tiling & Shared Boundaries

- **Lattice elements**
  - `⬡` — empty hexagonal cell (lattice position, undifferentiated)
  - `⬢` — instantiated hexagonal unit (differentiated ommatidium)
  - `▥` — periodic tiling (the lattice itself, as a structural object)
  - `▦` — lattice defect (mispatterned position; e.g. a fused ommatidium)

- **Shared-resource elements**
  - `╫` — edge-shared boundary (resource paid 1/2 by each neighbor)
  - `╪` — vertex-shared boundary (resource paid 1/3 by three neighbors)
  - `⊞ⁿ` — n-fold cost division across shared boundary
  - `⫝̸` — lattice axis (preferred crystallographic direction)

**Mnemonic**: hexagons for the tiling unit; double-bars for shared edges/vertices, recalling crystallography.

### Submodule O.2: Mirror-Inherited Chirality

- **Chirality elements**
  - `◖` — L-chiral unit
  - `◗` — R-chiral unit (mirror partner of ◖)
  - `⟜⟞` — chirality axis (internal directional marker of a unit)
  - `⏃` / `⏂` — trapezoidal asymmetry, two enantiomers

- **Field elements**
  - `═════` — equator / mirror line (boundary across which chirality flips)
  - `⥯ᴹ` — mirror flip operator
  - `↺ᴅ` / `↻ᴠ` — directionally-locked rotation (dorsal CCW vs. ventral CW)
  - `⨵` — coordinated polarity field (all units inherit orientation from a global reference)

**Mnemonic**: half-discs `◖◗` give visual L/R, `═════` is a literal mirror, `↺ᴅ/↻ᴠ` reads as "dorsal CCW / ventral CW."

### Submodule O.3: Fate-by-Context (Inductive Recruitment)

- **Cell-state elements**
  - `◌` — naive cell (eye-disc cell, fate uncommitted)
  - `◍` — competent cell (responsive to inductive cues)
  - `⩙` — founder cell (first specified; organizes the rest)
  - `●ᵢ` — cell with induced fate `i` (e.g. `●ᴿ⁸` for the R8 photoreceptor)

- **Recruitment operators**
  - `⊰` — sends inductive signal
  - `⊱` — receives inductive signal
  - `◌ ⊱ᵢ ●ⱼ` — naive cell adopts fate `j` upon receiving signal `i`
  - `⤳` — recruitment chain (A specifies B specifies C...)
  - `⫪` — "fate is a function of current neighborhood, not history"

**Mnemonic**: `◌→●` reads as "empty becomes full"; `⊰/⊱` are arrows that touch source/target without committing to a fixed type.

### Submodule O.4: Morphogenetic Front

- **Front elements**
  - `▶▶▶` — propagating differentiation front
  - `║◌◌║▶▶║●●║` — front with naive tissue ahead and patterned tissue behind
  - `⥉` — wave-locked spacing (units deposited at regular intervals in wake of front)
  - `⌖ₜ` — time-of-arrival anchor (developmental staging marker)

- **Wake dynamics**
  - `≣` — newly-deposited row (most recent units behind the front)
  - `≡` — mature row (older units, further behind front)
  - `⇶ₓ` — front-to-tissue feedback (front modifies as it passes)

**Mnemonic**: `▶▶▶` is the front; vertical bars `║` separate the three zones (ahead / at / behind); `≣`→`≡` shows aging rows.

### Submodule O.5: Convergent Sampling Architecture

- **Distributed-sensing elements**
  - `⤜⤜⤜` — array of distributed local samplers
  - `⫳` — optical/functional alignment (different units sampling same target)
  - `⫝̸→⨀` — convergence of dispersed signals to common downstream node
  - `⊛ₚ` — pooled integration (n weak signals → 1 strong signal)

- **Architectural elements**
  - `⬔ᵒ` — unit playing optical role
  - `⬔ᵇ` — unit playing biological/structural role
  - `⬔ᵉ` — unit playing electrical/signaling role
  - `⊚ᵐ` — multi-functional integration (one unit, multiple engineering roles)
  - `≀≀≀` — resolution/sensitivity trade-off axis

**Mnemonic**: `⤜⤜⤜` is many local probes; `⫝̸→⨀` is many-to-one convergence; subscripts `ᵒᵇᵉ` mark the engineering domain a unit serves in.

---

## Worked Examples

### Example O.1: Hexagonal Tiling with Shared Pigment Cells

```
   ⬢ ╫ ⬢ ╫ ⬢
   ╪   ╪   ╪
   ⬢ ╫ ⬢ ╫ ⬢          ▥⦗⬢⦘ → ⊞²╫ ⊕ ⊞³╪
   ╪   ╪   ╪
   ⬢ ╫ ⬢ ╫ ⬢
```

Reading: the lattice `▥` is built of instantiated hex units `⬢`; each edge `╫` is shared 2-fold (`⊞²`) between adjacent ommatidia and each vertex `╪` is shared 3-fold (`⊞³`). The 6 secondary pigment cells lie on edges (1/2-cost) and the 3 tertiaries on vertices (1/3-cost), so the screening sheath is paid for at roughly **(6×½ + 3×⅓) = 4 cells worth** per ommatidium rather than 9.

### Example O.2: Mirror Chirality Across the Equator

```
Dorsal:    ◖⏃ ◖⏃ ◖⏃ ◖⏃ ◖⏃          ↺ᴅ on each unit
              ⨵ →                   global polarity field
═══════════════════════════════════  equator (mirror line)
              ⥯ᴹ                    mirror flip
Ventral:   ◗⏂ ◗⏂ ◗⏂ ◗⏂ ◗⏂          ↻ᴠ on each unit
```

Reading: a single global polarity field `⨵` (Frizzled/Dachsous gradient) feeds opposite-handed rotations `↺ᴅ` / `↻ᴠ` on the two sides of the equator `═════`, with `⥯ᴹ` enforcing that ventral units are exact mirror images `◗⏂` of dorsal units `◖⏃`. The chirality is **inherited from position relative to the equator**, not from cell lineage.

### Example O.3: Sequential Inductive Recruitment of the 8 Photoreceptors

```
◌◌◌◌◌◌◌◌                naive eye-disc cells, equipotent
   ⩘                    lateral inhibition selects one
⩙●ᴿ⁸                    R8 founder specified
   ⊰ "be R2/R5"
◌ ⊱ → ●ᴿ² , ●ᴿ⁵         R2/R5 recruited as neighbors of R8
   ⊰ "be R3/R4"
◌ ⊱ → ●ᴿ³ , ●ᴿ⁴         R3/R4 recruited as neighbors of R2/R5
   ⊰ "be R1/R6"
◌ ⊱ → ●ᴿ¹ , ●ᴿ⁶         R1/R6 recruited at outer positions
   ⊰ Boss/Sevenless
◌ ⊱ → ●ᴿ⁷               R7 recruited atop R8
                        (4 cone cells, then pigments, then bristle: ⤳⤳⤳)
⫪ → ⟦⬢⟧                 fate-by-context, not lineage; mature ommatidium
```

Reading: the unmarked pool `◌◌◌` is reduced by lateral inhibition `⩘` to a single founder `⩙●ᴿ⁸`. The recruitment chain `⤳` proceeds **outward in concentric rings**, with each newly-specified cell signaling `⊰` its naive neighbors `◌` to adopt a context-specific fate `●ᵢ`. The crucial annotation `⫪` records that any of the `◌` could have become any `●ᵢ` — identity is positional.

### Example O.4: The Morphogenetic Furrow

```
posterior                                            anterior
║ ≡≡ ≣≣ ⩙●ᴿ⁸ ⩙●ᴿ⁸ ⩙●ᴿ⁸ ║ ▶▶▶ Hh/Dpp ▶▶▶ ║ ◌◌◌◌◌◌◌◌ ║
  mature  young  newest          front           naive
            ⥉ wave-locked spacing                    ⌖ₜ₀
            ⌖ₜ                                       (eye-disc edge)
```

Reading: the furrow `▶▶▶` (driven by Hedgehog/Decapentaplegic signaling) propagates from posterior `║◌◌◌║` to anterior, depositing founders `⩙●ᴿ⁸` at wave-locked intervals `⥉` in its wake. Behind the front, rows age `≣ → ≡` while continuing recruitment per O.3. The retina therefore matures **as a temporal gradient frozen into a spatial gradient** — `⌖ₜ` markers run from old (back) to young (front).

### Example O.5: Neural Superposition (Convergent Sampling)

```
        Target point P in visual field
              ⫳ ⫳ ⫳ ⫳ ⫳ ⫳ ⫳         (seven optical axes aligned)
        ↑     ↑     ↑     ↑
   ⬢₁⤜  ⬢₂⤜  ⬢₃⤜  ⬢₄⤜  ⬢₅⤜  ⬢₆⤜  ⬢₇⤜
   R1   R2   R3   R4   R5   R6   R7    (one PR from each of 7 adjacent units)
        ⫝̸ ⫝̸ ⫝̸ ⫝̸ ⫝̸ ⫝̸ ⫝̸
                  ↓
              ⨀ cartridge in lamina
              ⊛ₚ pooled signal (×7 photons, same resolution)
                  ↓
              ⟦■ Visual unit at point P ⟧
```

Reading: seven photoreceptors `⤜`, one each in seven neighboring ommatidia `⬢₁…⬢₇`, are co-aligned `⫳` on the same world point `P`. Their axons converge `⫝̸→⨀` onto a single cartridge in the lamina, where pooled integration `⊛ₚ` yields a 7× sensitivity boost without enlarging the lens — neatly resolving the resolution/sensitivity trade-off `≀≀≀`. The functional "pixel" is not the ommatidium; it is the **cartridge**, an emergent unit `⟦■⟧` distributed across seven anatomical ones.

---

## Integration: The Complete Ommatidial Design

```
║◌◌◌◌║ ▶▶▶ Hh/Dpp ▶▶▶ ║ ⩘ → ⩙●ᴿ⁸ ║          O.4 + O.3: furrow lays founders
                       ⥉
⩙●ᴿ⁸ ⊰ ⤳ ⊰ ⤳ ⊰ ⤳ → 8 PRs + 4 cones        O.3: sequential recruitment
                                            (per cluster)
⨵ → ↺ᴅ / ↻ᴠ across ═════                    O.2: global polarity feeds
                                            mirror-paired chirality
⏃ (dorsal)  ⥯ᴹ  ⏂ (ventral)                 O.2: trapezoid enantiomers
⬢ ╫ ⬢ ╫ ⬢      lattice with ⊞²╫ ⊕ ⊞³╪      O.1: shared-edge / vertex
  ╪   ╪                                      tiling
⊚ᵐ = ⬔ᵒ(lens+waveguide) ⊕                  O.5: multi-functional unit
     ⬔ᵇ(cells+pigment)  ⊕
     ⬔ᵉ(R-cell→axon)
⤜⤜⤜ ⫳ ⫝̸→⨀ ⊛ₚ                              O.5: neural superposition
                                            downstream pooling
⟦■ Compound eye: ~750 units, ~750 cartridges,
    field of view ~270°, peak photon gain ×7 ⟧
```

Reading top-to-bottom: the **furrow** (O.4) sweeps across naive tissue laying founders at locked spacing; each founder triggers an **inductive recruitment cascade** (O.3) to build out 20 cells in stereotyped positions; a **global polarity field** (O.2) feeds opposite-chirality rotations on either side of the equator; the mature units **tile** the surface with shared screening pigment at edges and vertices (O.1); each unit is a **multi-functional integration** of optical, structural, and electrical roles (O.5); and seven anatomical units **converge downstream** into one functional cartridge (O.5) — resolving the sensitivity/resolution trade-off.

---

## Meta-Insight: Ommatidial Design as a Topology of Constraints

The fruit fly compound eye is a remarkable lesson in design under simultaneous constraints. Reading the integrated diagram, several patterns emerge that this extension makes explicit:

1. **Tile, share, amortize.** Hexagonal close-packing (`▥`, `╫`, `╪`) is not aesthetic — it is the cheapest way to enclose ~750 lens units with screening pigment. Cost-sharing across boundaries (`⊞²`, `⊞³`) reduces per-unit cell budget by more than half.

2. **Pattern by wave, not by blueprint.** The furrow (`▶▶▶`) replaces a global coordinate system with a **moving local rule**: "lay one founder at every wave-locked interval `⥉`." There is no master plan — only a propagating front and the geometry it leaves behind.

3. **Fate from position, not from lineage.** The `⫪` annotation in O.3 captures something deep: the cell-type vocabulary (`●ᴿ¹…●ᴿ⁸`) is *defined by neighborhood role*, not by birth. The same naive cell `◌` becomes any photoreceptor according to who arrives next to it. This makes the system robust — a missing cell is replaced by recruitment, not by re-running the lineage clock.

4. **Asymmetry coordinated by a global field.** Every unit is internally asymmetric (`⏃` / `⏂`), but the asymmetry is not random — a global polarity field `⨵` synchronizes all units' orientations, and the equator `═════` flips chirality on one side via `⥯ᴹ`. **Local asymmetry + global field = coherent visual world model.**

5. **Anatomical units ≠ functional units.** Neural superposition (`⤜→⨀→⊛ₚ`) demonstrates that the **functional pixel** is the lamina cartridge, distributed across seven anatomical ommatidia. The design overlays two different tilings — one anatomical, one functional — onto the same retina. The body's "atomic unit" is a question with a different answer at different levels of analysis.

The deeper principle: **biological modular design is rarely about identical replicated units**. It is about a *minimal local interaction rule* (`⊰ → ◌ ⊱ → ●`), riding on a *propagating front* (`▶▶▶`), inside a *global orientation field* (`⨵`), producing *position-asymmetric units* (`⏃`/`⏂`) that *share resources at boundaries* (`╫`/`╪`) and *pool signals downstream* (`⊛ₚ`). The fruit fly's eye is one instance of this design pattern; the same vocabulary should extend cleanly to other repeating biological micro-units (cortical columns, intestinal crypts, hair follicles, plant trichomes).

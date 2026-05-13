---
module: software-engineering/asta-agent
extends: [core]
---

# TopoGlyph 9.0: Autonomous Agent Systems & Specification-Guided Testing

> An extension of TopoGlyph to model ASTA (Autonomous Software Testing Agent),
> a multi-agent system that explores web applications, verifies their behavior
> against declared specifications, and tracks what has and hasn't been tested.

## Motivation

Prior TopoGlyph iterations modeled *cognitive processes* — how minds (human or
collective) generate, transform, and integrate knowledge. ASTA is a different
kind of beast: an engineered system in which **bounded agents act on an
external environment under structural constraints, guided by an explicit
specification, while tracking the topology of what they've explored.**

This shifts our attention from the agent's *inner cognitive topology* to four
new structural concerns that TopoGlyph 8.0 cannot cleanly express:

1. **The agent/environment boundary** — what an agent can sense, what it can
   touch, and the indirection layers in between.
2. **Memory lifecycle stratification** — observations and beliefs persist at
   different scales (one step, one task, one session, across sessions), and the
   architecture is largely *about* how these layers are managed.
3. **Ontological duality** — the difference between an *abstract type* (a
   "form widget," a "login flow") and a *concrete observed instance*, and
   the matching machinery that bridges them.
4. **Specification as oracle** — declared rules and procedural flows act as
   external testable predicates against which observed state is evaluated.
5. **Coverage topology** — the agent must reason about the *shape of what has
   been explored* vs. what remains.
6. **Schema-forced cognition** — the agent's reasoning is structurally
   constrained: certain fields must be filled in a certain order, certain
   subsets of context must be injected, certain outputs are grammatically
   guaranteed by the harness rather than coaxed by the prompt.

These are the concerns that dominate ASTA's design. They generalize beyond
ASTA to any *engineered* agent system — Browser Use, SWE-agent, Manus, or any
production agent operating on a real environment.

---

## New Modules

### 1. Agent–Environment Interface Module

The boundary between an agent and its world is mediated by *channels*,
*handles*, and an *observation envelope* that is reassembled each step.

| Glyph | Meaning |
|---|---|
| `⊞⌖` | Environment anchor (the real, externally-existing world being acted on) |
| `⊢` | Observation channel (env → agent; agent senses) |
| `⊣` | Action channel (agent → env; agent acts) |
| `⌑` | Handle (compact abstract reference to a concrete env element) |
| `⌒⌑` | Bound handle (handle currently pointing at a live concrete object) |
| `⥊` | Sense operation (read environment into observation) |
| `⥋` | Act operation (commit chosen action to environment) |
| `⌬` | Schema gate (grammar-enforced structural constraint on I/O) |
| `⌭` | Behavioral steer (soft constraint via prompt / system message) |

Key principle this notation lets us state directly:

```
agent ⊣ ⌑   (agent acts only through handles, never directly on env)
agent ⊢ ⥊(⊞⌖)   (agent senses only what the harness chose to render)
```

The handle layer is critical: in ASTA (and Browser Use), the agent does not
generate XPath or CSS — it emits `click index=7`, where `7` is a freshly
re-issued handle. This means *the environment's identity is mediated by the
harness*, not by the agent.

### 2. Memory Lifecycle Module

ASTA's most important architectural distinction is *how long different kinds
of memory live*. Conflating these is the most common design failure.

| Glyph | Meaning |
|---|---|
| `◌` | Ephemeral state (lifetime = 1 step; e.g., browser DOM snapshot) |
| `◍` | Task-scoped state (lifetime = 1 task; e.g., action history, plan, app-state-changes) |
| `◎` | Session-scoped state (lifetime = 1 session; e.g., work queue, session history) |
| `●` | Cross-session state (persistent; e.g., app model, rules, coverage, issues) |
| `⥥` | Lifecycle promotion (e.g., task-scoped assertions → cross-session test cases) |
| `⥲⌬` | Compaction (lossy summarization of older history with explicit caveat) |
| `⌽` | Self-write loop (agent writes notes that re-appear in its next observation) |
| `⤿` | Truncation (drop entries; windowing) |
| `⟪ ⟫` | Observation envelope (the full per-step world view, rebuilt from layers) |
| `⟬ ⟭` | Cached prompt envelope (system message, sent every step, never rebuilt) |
| `⊿⤳` | Selective injection (filter cross-session resources to relevant subset) |

The defining ASTA pattern in this notation:

```
⟪ ⟬systemPrompt⟭ + ⊿⤳(●rules, ●flows, ●testData) + ◎sessionState + ◍taskState + ◌browserState ⟫
```

Each step, this envelope is *rebuilt from scratch*. The agent has no
conversation memory of its own; everything it knows is what the harness chose
to render this turn.

### 3. Ontological Duality Module

Web applications have a two-layer ontology: *what kinds of things can exist*
vs. *what we've actually observed*. ASTA models this explicitly.

| Glyph | Meaning |
|---|---|
| `Ⓦ` | Widget — abstract type with declared state space & action space |
| `Ⓒ` | Concrete component — observed instance with selectors and live attributes |
| `Ⓦ ⊳ Ⓒ` | Classification (this concrete is an instance of that widget) |
| `Ⓒ ≜ Ⓒ′` | Identity match (these two observations are the same component) |
| `≜ω` | Weighted match (probabilistic identity via scoring; id=50, name=40, label=30, type=20, pos=10) |
| `Ⓦ ⊠ Ⓦ` | Structural containment between widget types (form ⊠ input) |
| `Ⓦ ⥍ Ⓐ` | Widget supports action (form ⥍ submit) |
| `⫷Ⓦ⫸` | State space of a widget (all possible states an instance can occupy) |
| `Ⓟ` | Page (specialization of Ⓦ at the URL/route level) |
| `Ⓟ →ₙ Ⓟ′` | Navigation edge (page transitions to another page) |
| `Ⓟ ⊠ Ⓒ` | Containment edge (page contains component) |
| `Ⓒ ↝ Ⓒ′` | Affected edge (action on one component changes another) |

This is exactly the graph ASTA persists in MongoDB: nodes are `Ⓟ` and `Ⓒ`,
edges are `⊠`, `→ₙ`, `↝`.

### 4. Specification Oracle Module

Unlike a pure exploration agent, ASTA is *guided by explicit specifications*.
These act as external truth-conditions against which observed state is judged.

| Glyph | Meaning |
|---|---|
| `⟔` | Rule (Given/When/Then predicate; structural assertion) |
| `⟕` | Flow (named procedural shortcut producing a known state change) |
| `⟖` | Test case (predefined goal + assertions) |
| `⊨` | Verification pass (observed state satisfies oracle) |
| `⊭` | Verification fail (observed state violates oracle — i.e., a bug) |
| `⊮` | Underspecified (no oracle covers this state — exploratory territory) |
| `⟔ ⊳ Ⓦ` | Rule applicability (this rule applies to this widget type/page) |
| `⟕ ⊳ (Ⓟ→ₙⓅ′)` | Flow shortcut (this flow accomplishes this transition) |
| `⌬ᴳ` | Grammar gate of the DSL (rules/flows are statically parsed before run) |

Rules and flows form a *partial specification* — the agent reasons about which
parts of the application's behavior are covered by oracles, and which are not.

### 5. Coverage Topology Module

The most under-modeled aspect of autonomous testing systems: the *shape of
what has been explored*. This is not the same as "what is known to exist."

| Glyph | Meaning |
|---|---|
| `▦` | Covered region of state space (tested) |
| `▤` | Uncovered region (untested, exists in app model) |
| `▥` | Partially covered region (some states tested, others not) |
| `⩥c` | Coverage frontier (boundary between ▦ and ▤) |
| `⫳` | Coverage gap (specific untested (component, action, state) triple) |
| `⊰⥍` | Reachability path (sequence of actions to reach a region) |
| `⫷Ⓦ⫸ \ ▦` | Untested complement of widget state space |
| `▦ ⨁ ▤ = ⫷app⫸` | Coverage closure invariant |

In ASTA, the coverage service answers `check_if_tested(state, component,
component_state)` — that is, "does this triple lie inside `▦`?" The session
agent's prioritization is fundamentally an operation on `⩥c`: pick work that
expands the frontier most efficiently.

### 6. Structured Cognition / Schema-Forced Pipeline Module

ASTA (like Browser Use) forces the agent to reason in a specific order, using
*schema field ordering under constrained decoding* as the enforcement
mechanism. This is structurally different from "instructing the model in the
prompt to think step by step" — it is grammatically guaranteed.

| Glyph | Meaning |
|---|---|
| `⟦E⟧ → ⟦M⟧ → ⟦T⟧ → ⟦P⟧ → ⟦A⟧` | Eval → Memory → Think → Plan → Act pipeline |
| `⌬⊳` | Field-ordering constraint (schema enforces sequential field generation) |
| `⟜⌑` | Self-evaluation gate (must judge prior action before next action commits) |
| `⥹⌽` | Plan revision step (write next-step intent into self-observable memory) |
| `⌖₁` | Single-action commitment (exactly one action per turn) |
| `⫰` | Context partition (different agents see different slices of state) |
| `ⓢ` | Strategic role marker (sees high-level, never acts on env) |
| `ⓣ` | Tactical role marker (acts on env, narrow context) |
| `ⓞ` | Observer role marker (sees env + tactical agent, never acts) |

The mega-tool envelope IS the cognition pipeline — `⌬` forces fields to be
generated in order, so `⟦E⟧` must complete before `⟦A⟧` can begin. This is
the architectural lever that prevents "plow forward" behavior.

---

## Modeling ASTA in TopoGlyph 9.0

### A. The Three-Agent Architecture

```
⫰ ─────────────────────────────────────────────────────
  ⓢSessionAgent :: sees ●appModel, ●rules, ●flows,
                          ●testCases, ●issues, ●coverage,
                          ◎workQueue, ◎sessionHistory, ◎appState
                   :: does ⩥c-prioritize, dispatch, interpret, file
                   :: never ⊣⊞⌖
⫰ ─────────────────────────────────────────────────────
  ⓣTaskAgent     :: sees ⊿⤳(●rules, ●flows, ●testData),
                          ◍goal, ◍plan, ◍history, ◍appState,
                          ◌browserState
                   :: does ⥋(browser), ⟜⌑self-eval, ⟦E⟧→⟦M⟧→⟦T⟧→⟦P⟧→⟦A⟧
                   :: never ⥥ workQueue / issues / testCases
⫰ ─────────────────────────────────────────────────────
  ⓞObserverAgent :: sees ◌browserState, ⓣ-output (step-level)
                          + full ◍history (task-level)
                   :: does capture observations
                   :: never ⊣⊞⌖
⫰ ─────────────────────────────────────────────────────
```

The horizontal `⫰` bars are *context partitions*: each agent literally cannot
see what lies in another partition. This is not a courtesy — it is a hard
context-window constraint that motivated the multi-agent split.

Dispatch and report flow across partitions:

```
ⓢ ──dispatch(◍goal)──▶ ⓣ
ⓣ ──assert/record──▶ ◍taskResult ──▶ ⓢ
ⓞ ──observations──▶ ⓢ           (in parallel with ⓣ)
```

### B. The Application Model as Graph

```
⫷app⫸ = ⟦ Graph of Ⓟ, Ⓒ nodes joined by ⊠, →ₙ, ↝ edges ⟧

Ⓟhome ⊠ ⒸloginButton
ⒸloginButton →ₙ Ⓟdashboard
Ⓟdashboard ⊠ ⒸorderForm
ⒸorderForm ⊠ {Ⓒname, Ⓒqty, Ⓒsubmit}
Ⓒsubmit ↝ ⒸsuccessToast
```

Component matching across page visits is `≜ω` — a weighted scoring match
across (id, name, label, type, position). When the match resolves to an
existing node but under a different parent, the system emits a
*parent-changed* update — formally a graph rewrite preserving node identity:

```
(Ⓟₐ ⊠ Ⓒ) ⥥ (Ⓟᵦ ⊠ Ⓒ)    where Ⓒ.id is preserved
```

Stale detection is a temporal predicate over the graph:

```
isStale(Ⓒ) ⟺ Ⓒ.lastSeenAt < parent(Ⓒ).lastSeenAt
```

### C. The Task Agent's Step Loop

A single step of the task agent — the system's core inner loop — encodes
nearly every TopoGlyph 9.0 module at once:

```
                      ┌─────────────  rebuild every step  ─────────────┐
                      │                                                │
⟬systemPrompt⟭ ──▶ ⟪  ⊿⤳(●rules, ●flows, ●testData)    [cross-session] │
                   │   ◍goal + ◍plan + ◍history + ◍appState  [task]    │
                   │   ◌browserState   (handles ⌑₁ ⌑₂ … ⌑ₙ)  [step]    │
                   └────────────────────┬───────────────────────────────┘
                                        ▼
                              ⌬ schema-gate
                                        ▼
                  ⟦E⟧ → ⟦M⟧ → ⟦T⟧ → ⟦P⟧ → ⟦A: act(⌑ᵢ, args)⟧
                    │       │       │       │       │
                    │       │       │       │       └── ⌖₁  exactly one
                    │       │       │       └── ⥹⌽    plan delta
                    │       │       └── ⌭            CoT reasoning
                    │       └── ⌽                    self-note (next-step memory)
                    └── ⟜⌑                           force evaluation of prior step
                                        ▼
                              ⥋(browser)
                                        ▼
                  ◌browserState′  ──▶  next ⟪…⟫
```

Three things only TopoGlyph 9.0 can say cleanly:

- `⌬` forces `⟦E⟧` before `⟦A⟧`. Without the schema gate, models "plow
  forward" — assume success and chain actions on a false premise.
- `⌽` is the *only* state the model controls that survives to the next step
  *as input*. (`◌` is overwritten; `◍history` is harness-managed; the only
  channel for the model to write to its own future input is the `memory`
  field.)
- `⊿⤳` is the harness's choice, not the agent's. The agent cannot ask for
  rules it doesn't already see — its decision quality is bounded by the
  harness's selective-injection heuristic.

### D. Rules, Flows, and the Specification DSL

```
⟔(form: login)
   = ⌬ᴳ Given Ⓟlogin, When fill(Ⓒusername, U) ∧ fill(Ⓒpassword, P)
                        ∧ click(Ⓒsubmit),
         Then ▲transition → Ⓟdashboard
            ∧ ●currentUser ≜ U

⟕(login_as_admin)
   = ⌬ᴳ steps[
        navigate(/login),
        fill(Ⓒusername, "admin"),
        fill(Ⓒpassword, ⋄secret),
        click(Ⓒsubmit),
     ]
     ⊳ (Ⓟentry →ₙ Ⓟdashboard)
```

Note the use of `⋄` (tacit knowledge / secret placeholder, inherited from
TopoGlyph 5.0) for credentials whose values must not appear in agent context.

Verification:

```
state(Ⓒ) ⊨ ⟔   ⟹ pass
state(Ⓒ) ⊭ ⟔   ⟹ ⥥ ●issues   (file new bug)
state(Ⓒ) ⊮     ⟹ ⥥ ▤coverage  (note as untested but observed)
```

### E. Coverage-Driven Prioritization

The session agent's reprioritization is essentially gradient descent on the
coverage frontier:

```
work_queue ← argmax_{w} ( marginal(▦ ⊕ effect(w)) − cost(w) )

  where effect(w) = states reached by executing w
        marginal(▦′) = |▦′ \ ▦|
```

In TopoGlyph 9.0 prose:

```
ⓢ:
  observe ⩥c (current frontier)
  identify ⫳ candidates (specific untested triples)
  rank by ⊰⥍ cost × interestingness
  ⥥ ◎workQueue.next ⟶ ⓣ dispatch
  on ⓣ return: ⥥ ▦ (update coverage), maybe ⥥ ●issues, maybe ⥥ ●testCases
```

This is the layer that makes ASTA *autonomous* — without `⩥c`-aware
prioritization, the agent would either re-test the same regions or wander
through `⊮` (underspecified) territory at random.

---

## A Full ASTA Session in TopoGlyph

Putting all modules together, here is one full session — start to issue
filing:

```
ⓢ initialize:
   load ●appModel, ●rules, ●flows, ●coverage   (cross-session)
   build ◎workQueue ← ⩥c-rank(⫷app⫸ \ ▦)
                                                              [strategic]
─── partition ⫰ ─────────────────────────────────────────────────────────

ⓢ pop w ∈ ◎workQueue:
   dispatch ◍goal(w) ──▶ ⓣ                                    [hand-off]

─── partition ⫰ ─────────────────────────────────────────────────────────

ⓣ inner loop (per step):
   sense:   ⥊(⊞⌖) → ◌browserState   (handles reissued ⌑₁…⌑ₙ)
   build:   ⟪ ⟬sys⟭ + ⊿⤳(●rules, ●flows) + ◍ + ◌ ⟫
   decide:  ⌬ enforces ⟦E⟧→⟦M⟧→⟦T⟧→⟦P⟧→⟦A⟧
   act:     ⥋(⌑ᵢ, args)  ⌖₁  exactly one
   record:  history ← (eval, memory, thinking, plan, action, result)
   loop until done(summary)

   ⓞ in parallel:
      step-level: read ◌browserState ⊕ ⓣ-output
      catches: ⟔̸ ⊭ that ⓣ missed (broken image, console error, a11y issue)
      task-level: read full ◍history
      catches: retries, flakiness, reusable flow patterns

─── partition ⫰ ─────────────────────────────────────────────────────────

ⓣ done → return (◍assertions, ◍appState, ◍summary) ──▶ ⓢ
ⓞ      → return observations ──▶ ⓢ

─── partition ⫰ ─────────────────────────────────────────────────────────

ⓢ interpret:
   for each assertion a in ◍assertions:
      if a.pass:                 ⥥ ▦                    (update coverage)
      else if a ⊨ ⟔:             ⥥ ●issues              (file bug)
      else if a ⊮:               ⥥ ▥, ⥥ ●testCases?     (save as new test case)
   integrate ⓞ observations:    ⥥ ●issues / ⥥ ●flows   (e.g., learned shortcut)
   ⥥ ◎workQueue                                         (reprioritize)

   loop
```

---

## Meta-Insight: The Topology of Engineered Agency

Modeling ASTA in TopoGlyph 9.0 reveals what *all* production agent systems
have in common — a structural shape that earlier TopoGlyph editions could
gesture at but not name. The architecture of a working autonomous agent is
defined by four simultaneous topological choices:

1. **Channel discipline.** What passes through `⊢` (sense) and `⊣` (act)?
   What is mediated by handles (`⌑`)? Every channel that isn't deliberately
   placed becomes a leak — context bloat, unverifiable hallucination, or
   destructive side effect.

2. **Lifecycle stratification.** Memory layers `◌ ⊂ ◍ ⊂ ◎ ⊂ ●` form a
   strict hierarchy. The art of agent design is choosing *which layer each
   piece of belief lives in*, because that determines how long it survives,
   what it costs in tokens, and which agents can see it.

3. **Schema gates over prompt steers.** `⌬` (grammar) is strictly stronger
   than `⌭` (prompt). Production systems push as much behavior as possible
   from `⌭` into `⌬` — turning instructions ("evaluate before acting") into
   structural guarantees (schema field order under constrained decoding).

4. **Coverage as first-class topology.** The agent must reason about
   `⩥c` — the frontier of what has been explored — not just `⫷app⫸`. Without
   this, autonomous behavior degrades into either repetition or random walk.

The unifying claim is this: **autonomous agency is not "a smart model running
in a loop." It is a layered architecture of channels, lifecycles, gates, and
frontiers, in which the model is one component among many.** TopoGlyph 9.0
gives us notation precise enough to argue about each of those layers
independently — to ask "is this belief in the right lifecycle layer?", "is
this constraint a schema gate or a prompt steer?", "is this frontier
operation expressible in the current coverage representation?" — questions
whose answers determine whether a production agent works at all.

ASTA's design, viewed through TopoGlyph 9.0, is not really a design for a
testing system. It is a design for a *specification-guided exploration loop
over a graph-structured environment, executed by stratified cognition under
structural constraints*. The "testing" is what emerges when you point that
loop at a web application with `⟔`s defined; point it at a different
environment with different oracles and you have a different product
altogether.

This is, perhaps, the most useful thing TopoGlyph 9.0 lets us say: ASTA's
core invariants are not specific to software testing. They are the
invariants of *any* engineered agent system.

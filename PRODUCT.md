# Product

## Register

product

## Users

Egyptian physicians who own or run a clinic, and the assistants who work alongside them. They use Roashetta throughout a full clinic day — often on a desktop PC at the front desk or in the consulting room, sometimes a tablet, frequently offline. Tech-literacy and age vary widely; the doctor may be comfortable with software while an assistant is not, or vice versa. Arabic is the primary working language, with English as a fully supported alternative.

The job to be done: run an entire clinic day without friction or mistakes — register and find patients, manage the live waiting queue, document visits (vitals, history, diagnosis), write and print prescriptions on a digital canvas, request and record lab tests, track expenses, and review how the clinic is doing. Assistants do this within granular, doctor-controlled permissions.

## Product Purpose

Roashetta is a clinic management system for Egyptian healthcare providers, built primarily as an offline-capable desktop application with an embedded database. It exists to replace paper records and dated enterprise software at the scale of a single doctor or small clinic.

Success looks like a doctor moving patients through an entire day inside Roashetta — into and out of the queue, every visit documented, every prescription printed — and trusting at every step that nothing was misread, mis-assigned, or lost, in whichever language they work in.

## Brand Personality

**Calm clinical trust.** Three words: *trustworthy, calm, clear.* The voice is precise, reassuring, and plain-spoken in both Arabic and English — never jargon-heavy, never cute. The interface recedes so the patient's data is the focus.

Crucially, this is **warm professionalism, not sterility.** Trust here comes from care and calm, not from coldness. The teal identity, the Cairo typeface, and generous spacing should make the tool feel humane and steady — a colleague, not a hospital terminal.

## Anti-references

- **Sterile, cold clinical software.** Icy greys, hard edges, and impersonal density that adds stress instead of easing it. Roashetta is a medical tool, but it should never feel like one that resents being used.
- **Cluttered analytics dashboards.** Walls of equal-weight charts and numbers with no hierarchy or breathing room. Every data surface must lead with the one figure that matters before offering detail.

## Design Principles

1. **The patient is the hero; the tool recedes.** Chrome, navigation, and decoration stay quiet so clinical content reads first. When something competes with the patient's data for attention, the data wins.
2. **Clarity prevents harm.** In a medical record, a misread dose, an ambiguous save state, or the wrong patient is dangerous. Every state — identity, status, error, success — must be unambiguous at a glance. When a choice is between denser and clearer, choose clearer.
3. **Warm, not cold.** Reassurance is a design goal, not an accident. Carry it through calm color, humane copy, and room to breathe — never through sterility or hard clinical edges.
4. **Hierarchy over density, especially in data.** Dashboards and analytics lead with the single number that matters, then reveal detail on intent. Never a uniform grid of charts of equal weight.
5. **Arabic is first-class.** RTL layouts mirror correctly and Arabic typography gets the same craft as English — not bolted on after the Latin layout. Either language should feel like the one the product was designed for.

## Accessibility & Inclusion

- **Full RTL / Arabic parity is the explicit priority.** Layouts mirror correctly in `dir="rtl"`, Cairo renders cleanly at every weight, and no Arabic text is clipped, misaligned, or visibly second-class. Icons, chevrons, and directional motion flip appropriately.
- **WCAG 2.1 AA contrast as the baseline** (≥4.5:1 body text, ≥3:1 large text and UI affordances). This matters more than usual given varied clinic lighting and the range of users' ages and eyesight — favor the ink end of the ramp over light-grey "elegance."
- **Honor `prefers-reduced-motion`** with a crossfade or instant alternative for every transition; motion is never required to understand state.
- **Desktop and touch both.** The primary surface is a desktop PC, but clinic tablets are common — hit targets and layouts stay usable for both.

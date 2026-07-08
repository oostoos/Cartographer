<!-- @manualReviewRequested: 2026-07-06 -->
# Design system

Three hard rules:

1. **Tokens only, never a raw color/size.** Every CSS file consumes the custom properties in
   `tokens.css` (`var(--color-...)`, `var(--space-...)`, etc). A palette or spacing change should
   only ever require editing `tokens.css`.
2. **`EmojiIcon` is the only sanctioned way an emoji appears in JSX.** It forces an `aria-label`
   alongside every emoji so screen readers announce its meaning instead of the raw character —
   never write a bare emoji literal directly into a component. Reserved for decorative spots (page
   headings, nav links) where an emoji reads as "fun," not for interactive controls — see rule 3.
3. **`BasicIcon` is the only sanctioned way a traced (non-emoji) icon appears in JSX**, and is
   reserved for interactive controls — buttons (Skip/Unskip, Delete, Add/New, modal close, the
   drag handle) and the `Checkbox` control itself — so a "fun emoji" heading never gets confused
   for a clickable affordance. Same accessible-label contract as `EmojiIcon` (`{name, label}` →
   an `aria-label`/`title`'d span). Its glyphs are small inline SVGs drawn with
   `stroke="currentColor"`, so they inherit whatever text color the surrounding button/theme
   already sets — never give a `BasicIcon` its own hardcoded color.

`Button`/`Card`/`TextInput`/`TextArea`/`Checkbox`/`Select`/`Field` are the shared primitives —
extend one of these before writing a new one-off styled element. `TextInput`/`TextArea` forward
their ref, so a caller needing one (e.g. an auto-focused draft row) uses the real component
instead of hand-rolling a `cg-text-input`-classed element. `Select` is a fully custom-rendered
dropdown (trigger button + an absolutely-positioned options popup), not a restyled native
`<select>` — deliberately, so the open options list matches the app's look too, at the cost of
hand-built keyboard nav (arrows/Enter/Escape, focus staying on the trigger throughout) and an
outside-click listener instead of the native popup. Its props take an `options` array
(`{ value, label }[]`) rather than JSX `<option>` children. `Field` is the shared "label wraps a
control" wrapper (implicit label-text-node association, no `htmlFor`/id pairing, matching how
every field already worked) — composes with any control, including a `Checkbox` if a caller wants
visible label text next to one, though a boolean settings toggle (Archived, Skippable, and the
like) should reach for `CheckboxField` instead: it puts the label beside the box rather than
stacked above it (the shape `Field` always renders, being a `flex-direction: column` wrapper),
which is the correct layout for a checkbox specifically. `DragHandle` is the one drag-handle button every reorderable list
uses, spread with dnd-kit's own `attributes`/`listeners`. `TreeList` also exports `TreeRowButton`,
its own row-label idiom (a selectable button, optionally `isSelected`, or inert `isHeader` text)
shared by every page that builds a `renderRow`.

`List` is the one row-rendering primitive for every flat (non-hierarchical) collection of items
in the app — a notes feed, a project's tasks, a task's subtasks, the calendar page's left-sidebar
Blocks/Tasks cards. Same domain-agnostic philosophy as `TreeList`: it takes `groups`/items as
props and never interprets what a row means. Each `ListGroup` can be `collapsible` (a "Label (n)"
toggle hiding its items, own uncontrolled expand state — a different concept from `TreeList`'s
hierarchical expand/collapse, used for e.g. a completed-items group) and/or carry a `newItemLine`
(an always-present bottom input row that creates an item on Enter, then clears and refocuses
itself so several items can be typed back-to-back without re-clicking anything). Rows render as
gap-separated, hover-highlighted blocks — no divider lines — replacing the `border-bottom` CSS
(with its inconsistent last-child handling) that used to be copy-pasted per list.
`renderLeading`/`renderTrailing` render as siblings before/after a row's selectable button, never
nested inside it; omitting `onSelect` renders a row as inert content instead of a button, for a
list with no selection concept (e.g. a notes feed showing multi-line note bodies, which is also
why only the button variant gets nowrap/ellipsis truncation — inert rows wrap normally). One group
at a time can be `reorderable` via `@dnd-kit`, paired with the `useReorderableList` hook, which
extracts the optimistic-local-state-until-the-server-catches-up lifecycle every drag-and-drop list
in this app already needed (so there's only one render's worth of motion on drop, not a second one
once TanStack Query's cache notification lands a tick later) — the hook only owns drag mechanics
and that transient state; persisting the reorder (PATCHing whichever rows moved, mirroring the
cache) stays the caller's job via its `onReorder` callback.

`TreeList` is a generic, depth-agnostic expand/collapse tree — the Projects page's own sidebar
and the calendar page's left-sidebar Projects card (`app/calendar/ProjectsCard.tsx`, subprojects
nested and expandable beneath their parent) both build a `TreeNode<T>[]` and hand it to `TreeList`,
which handles indentation/recursion/the expand toggle; a `renderRow` prop supplies row content.

`Modal`/`ModalButton` are the standard shell for any create or edit flow — `ModalButton` owns its
own open/close state (or accepts `isOpen`/`onOpenChange` to be controlled externally, e.g. by a
keyboard shortcut via `core/utils/useShortcut.ts`) and renders a trigger `Button` plus a `Modal`;
use it instead of an inline page swap whenever a flow used to say "click a button, a form appears
in place." Confirmations (delete-with-a-choice, etc.) are a separate idiom and stay inline — only
*create*/*edit* flows move into a modal. `Modal` only steals focus onto its own dialog wrapper if
nothing inside it already has focus — this is what makes a form field's `autoFocus` actually work
when the modal opens, instead of the dialog wrapper grabbing focus back from it.

`MasterDetailLayout` is the shared "list, centered alone until something is selected, then slides
into a 50/50 split with a detail panel" shell used by the Projects page (the calendar page's own
center pane, app/calendar/CalendarPage.tsx, hand-rolls a similar but simpler swap since it only
ever shows one of the calendar or a detail pane, never both side by side) — it owns
the detail panel's close (X) button itself (clearing the selection back to the centered, alone
state), so callers' own detail components (`TaskDetailPane`, `ProjectDetailPane`) need no changes
to compose with it; any in-panel navigation those components already do (e.g. a project's own
breadcrumb) is a different, unrelated action that only ever changes *what's* selected, never
clears it. The centered↔split transition and the close animation are pure CSS (no animation
library) — closing keeps the previous detail content mounted for the duration of the CSS
transition before actually unmounting it, so the panel visibly shrinks away instead of vanishing
instantly.

`CollapsibleCard` generalizes that same "▾/▸ toggle" idiom from a `List` group's rows to arbitrary
content — a `Card` that collapses behind its own header button, with an optional `headerActions`
slot (e.g. a "+ New" button) rendered as a sibling of the toggle, never nested inside it. Used by
the calendar page's left sidebar (`app/calendar/LeftSidebar.tsx`) for its Blocks/Tasks/Projects
sections, each collapsible independently so a user can tuck away whichever they don't need.

`SetSelection` is a pill-list choice control — an alternative to `Select` for a short list of
options where every choice can stay visible at once instead of hidden behind a dropdown (e.g.
`TaskDetailPane.tsx`'s Duration field). Defaults to single-select (`role="radiogroup"`, one pill
always active, clicking a pill selects it — there's no way to deselect down to nothing, matching
a field that always has some value); passing `multiple` switches to a row of independent toggle
buttons (`role="group"`, each pill `aria-pressed`, click toggles that one pill only). No open/
closed popup state at all, unlike `Select` — every option is an always-visible button, so there's
no hand-built listbox keyboard nav to maintain.

`Grid` is a compact multi-row editor for a small set of same-shaped items — built for
`app/blocks/BlockOccurrenceEditor.tsx`'s "advanced" per-unit time slots (one row per selected
weekday/day-of-month/month-day, each with its own start time/duration), but domain-agnostic like
`List`/`TreeList`: it takes `rows`/a `renderCell` and never interprets what a row means. Above the
rows, a "copy from" bar — pick a source row from a `Select`, check which other rows should receive
its value via each row's own `Checkbox`, then Apply (`onCopyRowToTargets`) — is the one bulk-edit
affordance, deliberately simpler than per-row drag/popover interactions not seen elsewhere in the
design system. `onRemoveRow` is optional — omit it for a fixed-universe grid (e.g. every weekday
always shown, only ever toggled off) where rows can be hidden but never deleted outright. An
optional `summary` string (computed by the caller, same as `List`'s `emptyMessage`) renders above
the rows as a plain-language description of what they add up to.

`Button` defaults to `emphasis="ghost"` (outline + a light tint of the variant's color) — this is
the preferred look everywhere for now; pass `emphasis="solid"` only where ghost reads as too
quiet. Icon-only buttons (`iconOnly`) are preferred for inline list-row actions — pair them with
a `BasicIcon` (or `EmojiIcon` only for a genuinely decorative case) and let its `label` double as
the accessible name/tooltip. Whenever a button pairs text with an icon, the icon always mounts to
the *right* of the text, never the left.

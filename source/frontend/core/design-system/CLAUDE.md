# Design system

Two hard rules:

1. **Tokens only, never a raw color/size.** Every CSS file consumes the custom properties in
   `tokens.css` (`var(--color-...)`, `var(--space-...)`, etc). A palette or spacing change should
   only ever require editing `tokens.css`.
2. **`EmojiIcon` is the only sanctioned way an emoji appears in JSX.** It forces an `aria-label`
   alongside every emoji so screen readers announce its meaning instead of the raw character —
   never write a bare emoji literal directly into a component.

`Button`/`Card`/`TextInput`/`TextArea`/`Checkbox` are the shared primitives — extend one of these
before writing a new one-off styled element. `Sidebar` is a generic search + create + grouped-list
shell (shared by the Tasks and Projects pages) that composes `Card`/`Button`/`TextInput` — it
takes items/groups as props and stays domain-agnostic; filtering/grouping logic belongs in the
calling page, not in `Sidebar` itself.

`Modal`/`ModalButton` are the standard shell for any create or edit flow — `ModalButton` owns its
own open/close state and renders a trigger `Button` plus a `Modal`; use it instead of an inline
page swap whenever a flow used to say "click a button, a form appears in place." Confirmations
(delete-with-a-choice, etc.) are a separate idiom and stay inline — only *create*/*edit* flows
move into a modal.

`Button` defaults to `emphasis="ghost"` (outline + a light tint of the variant's color) — this is
the preferred look everywhere for now; pass `emphasis="solid"` only where ghost reads as too
quiet. Icon-only buttons (`iconOnly`) are preferred for inline list-row actions — pair them with
an `EmojiIcon` and let its `label` double as the accessible name/tooltip. Whenever a button pairs
text with an icon, the icon always mounts to the *right* of the text, never the left.

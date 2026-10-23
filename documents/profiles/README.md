# TKA project profiles

Each profile in this directory represents document metadata and defaults only. The executable token source is always `panda.config.ts`; profiles must not copy brand hex values or override `brand.500` and `accent.500`.

- `tka-default.json`: explicit fallback profile, Arabic + RTL defaults, all five supported formats.
- Use `--profile <id>` to select a profile. Unknown profiles fail closed; the renderer never silently changes project identity.
- Before adding a profile, validate its shape against `schemas/project-profile.schema.json` and test its direction and outputs.

Profiles define defaults and allowed formats; they do not by themselves prove that a generated artifact is correct.

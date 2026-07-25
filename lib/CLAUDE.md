# lib/

Stack-agnostic library code, one subdirectory per language. See `.ajx/AustinsSweManifesto.md` ("Libraries" section).

- Code here must require no business or stack knowledge — only generic building blocks.
- No dependencies outside the base language (no frameworks — e.g. no React, no
  Flask). A dependency on the language's own standard library is fine; a
  dependency on a framework belongs in `src/common` instead, even if the code
  itself is otherwise generic/reusable.
- Each language subdirectory exposes a barrel that surfaces everything the library defines, with a short description per definition.
- Build library definitions on top of library definitions.

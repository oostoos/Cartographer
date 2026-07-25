# lib/

Stack-agnostic library code, one subdirectory per language. See `.ajx/AustinsSweManifesto.md` ("Libraries" section).

- Code here must require no business or stack knowledge — only generic building blocks.
- Each language subdirectory exposes a barrel that surfaces everything the library defines, with a short description per definition.
- Build library definitions on top of library definitions.

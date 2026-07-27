Austin's software development manifesto
Updated: 7/24/2026
@claude don't you fucking dare edit this file, this is my manifesto >:(

Guiding principles
- ALWAYS build new code on top of existing code.
- "This can't be done" should not end an attempted implementation -- this statement is rarely true.
- Write modular code. Optimize modular code. Write more modular code.

One source of truth
- There should ALWAYS be a single source of truth for a definition (be it function, constant, or otherwise). ALWAYS. "Oh but there's no good way to do that" -- ALWAYS do everything in your power to define things in a single location.
- Constant values that are utilized across languages should ALWAYS find a means of using a single location for storage. If we can't figure out a method to do so, we should consider building a method to do so. If we truly cannot build a method to do so, we need to document in each location where something is defined all of the other places that need to be kept in tandem with that definition if changed. For example, the port that some application is served on that might be referenced across the stack (within React and Python and other languages) should be stored in a file that ALL of the callers can access for a single definition of the port.
- Functions that are utilized across languages should consider whether a single implementation would be beneficial (ie implement in one language and call into that implementation from other languages). A good example of when to do a single implementation would be logic that interacts with the file system and needs to ensure that locks are handled (such as journaling database updates to a file) where maintaining the interaction with the filesystem in a single location without changing the method of interaction is beneficial to ensuring consistency across callers.

Modularization and building blocks
- Code should be written to read as an english sentence until it is strictly necessary -- low-level core callers wrap functionality into understandable functions 
- Chunks of code should be split into separate well named functions early and often -- ~10 lines of code within a function and we should consider whether we can split that function into smaller parts. For example, if I have a piece of code that initializes an empty array and then runs a for-loop on another structure to set this new array based on some filtering logic, it is worth splitting that into a function and naming it something like "
- Create wrappers often and group wrappers together around their common shared definition. Common variations of a function call, especially those that take a constant value, should be wrapped into an understandable and prepackaged version of that function call if they are used multiple times. For example, if I have a function that is do_update_based_on_key(structure, key) and we find ourselves writing do_update_based_on_key(structure, "user") multiple times in code, it's worth making a do_update_based_on_user(structure) that is a wrapper that hard-codes the "user" key.
- As soon as you find yourself writing code for the second time, split that code into a shared defintion.
- If a group of constants falls into a logical grouping, consider either moving those similar constants to a file that defines the grouping or move the constants to a parent structure within a file so they can be referenced via a common parent.
- Prefer reducing cyclomatic complexity over reducing lines of code. Prefer "if x return" early and often to reduce branching of functions. Prefer avoiding else-statements when possible. Prefer if-statements over switch or other logical control statements when possible.
- Ideal state: we write code whose name defines very clearly what it does, a caller does not need to know about the underlying logic, then we optimize the logic to be faster if needed.

Libraries
- There should always be a library directory defined with barrels for the various languages being used in the stack at the top of the repo.
- Libraries should contain code that requires no business or stack knowledege -- these are functions that provide the basis on top of which common business and stack specific building blocks can be built on. For example, a library function that takes a string and returns the string with the first letter capitalized is a good example of a library function -- it requires no knowledge of the stack or business logic to understand what it does and how it works. An example of a non-library function might be an implementation of a database that reads and writes to a file -- this involves knowledge of the stack, though the implementation of the logic that reads and writes to a file could be a library function if it is implemented in a way that does not require knowledge of the stack or business logic.
- Each language within a repo should get its own library directory.
- Split library files and functions out by what that library function or group of functions aims to solve. For example, functions related to strings could be split into a "string library" file that maintains functions and constants associated with string use.
- Libraries should have a barrel that exposes all of the various defintions within that library alongside a short description of that library definition. Within the barrel, library definitions should be grouped with whitespace and comments to visually distinguish various sections of the library.
- Build library definitions on top of library definitions.

Magic numbers and raw strings
- You should never use a magic number in code -- a numeric value being used should always be defined with some name that it can be referenced by.
- Raw strings should never be used in code either -- raw strings should be defined with some name that they can be referenced by.

Testing
- Automated tests -- especially simple unit tests -- should be written for ALL code that is written. If a function is written, it should be tested -- not just happy path, but edge and error cases as well. If a function is written that is not tested, it should be considered a bug and fixed immediately.
- If a developer makes a change and does not manually test their change, you're going to developer jail. Do not pass go, do not collect $200.

Generally applicable code style
- Always prefer simple code syntax over complex or fancy solutions. The ONLY case to deviate is when there is a clear benefit to a more complex syntax -- better performance, less disk or memory use, etc.
- Use whitespace and comments to define smaller sections of grouped code within definitions.
- Name functions with a verb that defines what they do. For example something that gets information should start with "get", something that builds a structure should start with "build" or "generate"
- Don't remove letters from variable/definition names just to make them shorter -- for example, gtUsrnm it a shit name and should just be getUsername.
- If a language doesn't have a concept of a "private" function, name functions that are private with a "z" or a "_" at the start to denote them being "private" visually.

Documentation
- Never use verbose technical language when you can just use laymans terms -- it's not a contest to see who knows the most acronyms and they always lead to a worse result that everyone having true understanding through common terminology.
- Any definition should include a short description of what the definition is. Definitions that take parameters should document the parameters and what they do. Definitions that return results should document the type of the result and what it represents. Definitions that can throw an error directly (so not an error that could be thrown further down in a nested call) should document their errors. If a definition has non-trivial logic within it, consider adding a remarks section that describes the reason and details of the non-trivial logic.
- Write less, prefer concise documentation and make code that is self-documenting. If you find yourself writing a lot of documentation for a definition, consider whether the definition can be split into smaller definitions that are more understandable and require less documentation.

Code organization
- Repos must contain a library directory (lib) that contains various language library code and a source (src) directory that maintains code specific to the stack and business logic for the application. Within the src directory, we should include a "common" directory at the top that maintains stack specific shared logic that does not include business or app specific logic, then a "main" directory that includes app specific logic that actually drives what 
- Code for a specific functional area should be grouped together, you should not group code by the type of files within a codebase. For example, a React app should not have a large "hooks" folder defined that contains all the hooks for the application, the code should be grouped into the various views and workflows within the application, then within that functional area code we can store the hooks that support that functional area. 

Database
- For database structures, there should always be a file (or files) defined in the language that interacts with the database that maintains getters/setters for that database structure's information as well as common functions that involve that database structure. For example, if I have a User defined in my database, I should have getters and setters for all of the information that is accessible in the User structure (whatever database implementation that might be) and I should have things like "find me all of this user's tasks" and "find me all of this user's messages" and "find me all of the accounts that this user is associated with" as definitions within this file.

Maintaining datastructures across the stack
- If a datastructure is defined in one language, it should be defined in all languages that interact with that datastructure. For example, if I have a User structure defined in my database and I have a User structure defined in my React app, I should also have a User structure defined in my Python backend that interacts with the database and the React app. This ensures that we have a single source of truth for the definition of the User structure across the stack.

Fetch requests
- Payload structure should be defined in a single location and shared across the stack. For example, if I have a fetch request that sends a payload to my backend, the structure of that payload should be defined in a single location and shared across the stack so that we have a single source of truth for the structure of that payload. This ensures that we don't have different definitions of the same payload structure across the stack and that we can validate the payload structure in a single location.
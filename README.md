# D20Server

Tool for playing P&P games online. Including Character Sheets, FOW, Dice Simulation, Voice Chat and more.
Built on node.js and pure JavaScript and hosts a webserver allowing players to connect simply using their browsers.

Currently not yet recommended for public use. Major refactor, documentation and testing work is currently being done/prepared. User documentation and a demonstration server is also still being worked on.

## Running a local server
A node.js version 14 environment is currently required as newer versions break compatibility with requried node modules.
To prepare the project for running or development run:

     npm install

To start a local server directly from the development files run:

     npm start

Creating a Player/GM account required for connecting to the server can then be performend from the command line interface. Enter 'help' to get started.

## Preparing a final build

Run this command to "build" an optimized version located in the build directory:

     npm run build


## Extending functionality with modules

The architecture of this tool allows for extending it with new functionality by creating custom modules.
While this functionality already exists (and is heavily used in this repository) documentation and tooling to make it developer friendly is not yet done.

#!/usr/bin/env node

/**
 * Greet CLI — A simple greeting tool.
 * Usage: greet [name]
 */

const { formatGreeting } = require('./utils');

const name = process.argv[2] || 'World';
const greeting = formatGreeting(name);
console.log(greeting);

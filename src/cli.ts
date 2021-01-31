#!/usr/bin/env node

import { program } from "commander";
import fs from "fs";
import os from "os";
import path from "path";
import { table } from "table";
import { spawn } from "child_process";

const packageJSON = require("../package.json");
program.version(packageJSON.vesion);

/**
 * The CLI manages a list of entries and permits opening
 * a reverse tunnel easily
 */

const HOME_DIR = os.homedir();
const MGROK_FOLDER_PATH = path.join(HOME_DIR, ".mgrok");
const MGROK_FILE_PATH = path.join(HOME_DIR, ".mgrok", "config.json");

const TABLE_HEADERS = [
  "name",
  "host",
  "localPort",
  "remotePort",
  "indentityKey",
];

interface ConfigEntry {
  name: string;
  host: string;
  localPort: string;
  remotePort: string;
  identityKey?: string;
}

interface Config {
  entries: ConfigEntry[];
}

function saveConfig(config: Config) {
  let mgrokFolderExists = fs.existsSync(MGROK_FOLDER_PATH);

  if (!mgrokFolderExists) fs.mkdirSync(MGROK_FOLDER_PATH);

  fs.writeFileSync(MGROK_FILE_PATH, JSON.stringify(config));
}

function getConfig(): Config | null {
  let mgrokFolderExists = fs.existsSync(MGROK_FOLDER_PATH);

  if (!mgrokFolderExists) return null;

  let configJSON = fs.readFileSync(MGROK_FILE_PATH).toString();

  let config = JSON.parse(configJSON) as Config;

  if (config.entries.length === 0) return null;

  return config;
}

function printConfigAsTable(config: Config) {
  let tableMap = [TABLE_HEADERS];

  config.entries.forEach((ce) => {
    tableMap.push([
      ce.name,
      ce.host,
      ce.localPort,
      ce.remotePort,
      ce.identityKey || "No",
    ]);
  });

  console.log(table(tableMap));
}

function printConfigRowAsTable(entry: ConfigEntry) {
  let tableMap = [TABLE_HEADERS];
  tableMap.push([
    entry.name,
    entry.host,
    entry.localPort,
    entry.remotePort,
    entry.identityKey || "No",
  ]);
  console.log(table(tableMap));
}

program
  .command("add <name> <host> <localPort> <remotePort> [identityKey]")
  .description("adds an entry to the reverse tunnel list")
  .action((name, host, localPort, remotePort, identityKey) => {
    let config = getConfig();

    if (!config) {
      config = { entries: [] };
    }

    let newEntry: ConfigEntry = {
      name,
      host,
      localPort,
      remotePort,
      identityKey,
    };

    config.entries.push(newEntry);

    saveConfig(config);

    console.log("Entry added successfully!");
    printConfigRowAsTable(newEntry);
  });

program
  .command("connect <name>")
  .description("tries to open a reverse tunnel to the entry passed as name")
  .action((name) => {
    let config = getConfig();

    if (!config) {
      config = { entries: [] };
    }

    let entryToBeConnected = config.entries.find((ce) => ce.name === name);
    if (!entryToBeConnected)
      return console.log(
        `No entries found with name ${name}, try the 'list' command.`
      );

    const ssh = spawn("ssh", [
      "-R",
      `${entryToBeConnected.remotePort}:localhost:${entryToBeConnected.localPort}`,
      entryToBeConnected.host,
    ]);

    ssh.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stdin.pipe(ssh.stdin);

    ssh.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    ssh.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });
  });

program
  .command("edit <name> <host> <localPort> <remotePort> [identityKey]")
  .description("edits an entry, you must pass all the values again")
  .action((name, host, localPort, remotePort, identityKey) => {
    let config = getConfig();

    if (!config) {
      config = { entries: [] };
    }

    let editedEntry: ConfigEntry = {
      name,
      host,
      localPort,
      remotePort,
      identityKey,
    };

    let entryFound = false;
    config.entries = config.entries.map((ce) => {
      if (ce.name !== name) return ce;

      entryFound = true;
      return editedEntry;
    });

    if (!entryFound)
      return console.log(
        `No entries found with name ${name}, try the 'list' command.`
      );

    saveConfig(config);

    console.log("Entry edited successfully!");
    printConfigRowAsTable(editedEntry);
  });

program
  .command("rm <name>")
  .description("removes an entry from the reverse tunnel list")
  .action((name) => {
    let config = getConfig();

    if (!config) {
      config = { entries: [] };
    }

    let entryRemoved: ConfigEntry | null = null;
    config.entries = config.entries.filter((ce) => {
      if (ce.name === name) {
        entryRemoved = ce;
        return false;
      }

      return true;
    });

    if (!entryRemoved)
      return console.log(
        `No entries found with name ${name}, try the 'list' command.`
      );

    saveConfig(config);

    console.log("Entry removed successfully!");
    printConfigRowAsTable(entryRemoved);
  });

program
  .command("list")
  .description("list all entries")
  .action(() => {
    let config = getConfig();

    if (!config) {
      return console.log(
        "no entries found, create one by using the 'add' command"
      );
    }

    printConfigAsTable(config);
  });

program
  .command("config")
  .description("prints the config location")
  .action(() => {
    console.log(MGROK_FILE_PATH);
  });

program.parse(process.argv);

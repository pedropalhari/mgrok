#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const table_1 = require("table");
const child_process_1 = require("child_process");
const packageJSON = require("../package.json");
commander_1.program.version(packageJSON.version);
/**
 * The CLI manages a list of entries and permits opening
 * a reverse tunnel easily
 */
const HOME_DIR = os_1.default.homedir();
const MGROK_FOLDER_PATH = path_1.default.join(HOME_DIR, ".mgrok");
const MGROK_FILE_PATH = path_1.default.join(HOME_DIR, ".mgrok", "config.json");
const TABLE_HEADERS = [
    "name",
    "host",
    "localPort",
    "remotePort",
    "indentityKey",
];
function saveConfig(config) {
    let mgrokFolderExists = fs_1.default.existsSync(MGROK_FOLDER_PATH);
    if (!mgrokFolderExists)
        fs_1.default.mkdirSync(MGROK_FOLDER_PATH);
    fs_1.default.writeFileSync(MGROK_FILE_PATH, JSON.stringify(config));
}
function getConfig() {
    let mgrokFolderExists = fs_1.default.existsSync(MGROK_FOLDER_PATH);
    if (!mgrokFolderExists)
        return null;
    let configJSON = fs_1.default.readFileSync(MGROK_FILE_PATH).toString();
    let config = JSON.parse(configJSON);
    if (config.entries.length === 0)
        return null;
    return config;
}
function printConfigAsTable(config) {
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
    console.log(table_1.table(tableMap));
}
function printConfigRowAsTable(entry) {
    let tableMap = [TABLE_HEADERS];
    tableMap.push([
        entry.name,
        entry.host,
        entry.localPort,
        entry.remotePort,
        entry.identityKey || "No",
    ]);
    console.log(table_1.table(tableMap));
}
commander_1.program
    .command("add <name> <host> <localPort> <remotePort> [identityKey]")
    .description("adds an entry to the reverse tunnel list")
    .action((name, host, localPort, remotePort, identityKey) => {
    let config = getConfig();
    if (!config) {
        config = { entries: [] };
    }
    let newEntry = {
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
commander_1.program
    .command("connect <name>")
    .description("tries to open a reverse tunnel to the entry passed as name")
    .action((name) => {
    let config = getConfig();
    if (!config) {
        config = { entries: [] };
    }
    let entryToBeConnected = config.entries.find((ce) => ce.name === name);
    if (!entryToBeConnected)
        return console.log(`No entries found with name ${name}, try the 'list' command.`);
    console.log("Connecting to:");
    printConfigRowAsTable(entryToBeConnected);
    const ssh = child_process_1.spawn("ssh", [
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
commander_1.program
    .command("edit <name> <host> <localPort> <remotePort> [identityKey]")
    .description("edits an entry, you must pass all the values again")
    .action((name, host, localPort, remotePort, identityKey) => {
    let config = getConfig();
    if (!config) {
        config = { entries: [] };
    }
    let editedEntry = {
        name,
        host,
        localPort,
        remotePort,
        identityKey,
    };
    let entryFound = false;
    config.entries = config.entries.map((ce) => {
        if (ce.name !== name)
            return ce;
        entryFound = true;
        return editedEntry;
    });
    if (!entryFound)
        return console.log(`No entries found with name ${name}, try the 'list' command.`);
    saveConfig(config);
    console.log("Entry edited successfully!");
    printConfigRowAsTable(editedEntry);
});
commander_1.program
    .command("rm <name>")
    .description("removes an entry from the reverse tunnel list")
    .action((name) => {
    let config = getConfig();
    if (!config) {
        config = { entries: [] };
    }
    let entryRemoved = null;
    config.entries = config.entries.filter((ce) => {
        if (ce.name === name) {
            entryRemoved = ce;
            return false;
        }
        return true;
    });
    if (!entryRemoved)
        return console.log(`No entries found with name ${name}, try the 'list' command.`);
    saveConfig(config);
    console.log("Entry removed successfully!");
    printConfigRowAsTable(entryRemoved);
});
commander_1.program
    .command("list")
    .description("list all entries")
    .action(() => {
    let config = getConfig();
    if (!config) {
        return console.log("no entries found, create one by using the 'add' command");
    }
    printConfigAsTable(config);
});
commander_1.program
    .command("config")
    .description("prints the config location")
    .action(() => {
    console.log(MGROK_FILE_PATH);
});
commander_1.program.parse(process.argv);
//# sourceMappingURL=cli.js.map
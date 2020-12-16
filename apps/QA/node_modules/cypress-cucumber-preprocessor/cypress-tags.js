#!/usr/bin/env node

const { Parser } = require("gherkin");
const glob = require("glob");
const fs = require("fs");
const { execFileSync } = require("child_process");

const { shouldProceedCurrentStep } = require("./lib/tagsHelper");

const debug = (message, ...rest) =>
  process.env.DEBUG
    ? // eslint-disable-next-line no-console
      console.log(`DEBUG: ${message}`, rest.length ? rest : "")
    : null;

function parseArgsOrDefault(argPrefix, defaultValue) {
  const matchedArg = process.argv
    .slice(2)
    .find((arg) => arg.includes(`${argPrefix}=`));

  // Cypress requires env vars to be passed as comma separated list
  // otherwise it only accepts the last provided variable,
  // the way we replace here accomodates for that.
  const argValue = matchedArg
    ? matchedArg.replace(new RegExp(`.*${argPrefix}=`), "").replace(/,.*/, "")
    : "";

  return argValue !== "" ? argValue : defaultValue;
}

const envGlob = parseArgsOrDefault("GLOB", false);
const envTags = parseArgsOrDefault("TAGS", "");

let specGlob = envGlob || "cypress/integration/**/*.feature";
let ignoreGlob = "";
let usingCypressConf = false;

if (!envGlob) {
  try {
    // TODO : curently we don't allow the override of the cypress.json path
    // maybe we can set this path in the plugin conf (package.json : "cypressConf": "test/cypress.json")
    // eslint-disable-next-line import/no-unresolved,global-require
    const cypressConf = require("../../cypress.json");
    const integrationFolder =
      cypressConf && cypressConf.integrationFolder
        ? cypressConf.integrationFolder.replace(/\/$/, "")
        : "cypress/integration";

    if (cypressConf && cypressConf.ignoreTestFiles) {
      ignoreGlob = cypressConf.ignoreTestFiles;
    }

    if (cypressConf && cypressConf.testFiles) {
      let testFiles = !Array.isArray(cypressConf.testFiles)
        ? cypressConf.testFiles.split(",")
        : cypressConf.testFiles;
      testFiles = testFiles.map((pattern) => `${integrationFolder}/${pattern}`);
      specGlob =
        testFiles.length > 1 ? `{${testFiles.join(",")}}` : testFiles[0];
    } else {
      specGlob = `${integrationFolder}/**/*.feature`;
    }
    console.log("Using cypress.json configuration:");
    console.log("Spec files: ", specGlob);
    if (ignoreGlob) console.log("Ignored files: ", ignoreGlob);
  } catch (err) {
    usingCypressConf = false;
    specGlob = "cypress/integration/**/*.feature";
    console.log("Failed to read cypress.json, using default configuration");
    console.log("Spec files: ", specGlob);
  }
}

debug("Found glob", specGlob);
debug("Found tag expression", envTags);

const paths = glob
  .sync(specGlob, {
    nodir: true,
    ignore: usingCypressConf ? ignoreGlob : "",
  })
  .filter((pathName) => pathName.endsWith(".feature"));

const featuresToRun = [];

paths.forEach((featurePath) => {
  const spec = `${fs.readFileSync(featurePath)}`;
  const parsedFeature = new Parser().parse(spec);

  if (!parsedFeature.feature) {
    debug(`Feature: ${featurePath} is empty`);
    return;
  }

  const featureTags = parsedFeature.feature.tags;
  const featureShouldRun = shouldProceedCurrentStep(featureTags, envTags);
  const taggedScenarioShouldRun = parsedFeature.feature.children.some(
    (section) =>
      section.tags &&
      section.tags.length &&
      shouldProceedCurrentStep(section.tags.concat(featureTags), envTags)
  );
  debug(
    `Feature: ${featurePath}, featureShouldRun: ${featureShouldRun}, taggedScenarioShouldRun: ${taggedScenarioShouldRun}`
  );
  if (featureShouldRun || taggedScenarioShouldRun) {
    featuresToRun.push(featurePath);
  }
});

function getOsSpecificExecutable(command) {
  return process.platform === "win32" ? `${command}.cmd` : command;
}

function getCypressExecutable() {
  const command = getOsSpecificExecutable(`${__dirname}/../.bin/cypress`);
  // fallback to the globally installed cypress instead
  return fs.existsSync(command) ? command : getOsSpecificExecutable("cypress");
}

try {
  if (featuresToRun.length || envTags === "") {
    execFileSync(
      getCypressExecutable(),
      [...process.argv.slice(2), "--spec", featuresToRun.join(",")],
      {
        stdio: [process.stdin, process.stdout, process.stderr],
      }
    );
  } else {
    // eslint-disable-next-line no-console
    console.log("No matching tags found");
    process.exit(0);
  }
} catch (e) {
  debug("Error while running cypress (or just a test failure)", e);
  process.exit(1);
}

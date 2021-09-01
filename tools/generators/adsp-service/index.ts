import {
  Tree,
  formatFiles,
  installPackagesTask,
  generateFiles,
  getWorkspaceLayout,
  names,
  updateProjectConfiguration,
  readProjectConfiguration,
} from '@nrwl/devkit';
import { applicationGenerator } from '@nrwl/express';
import { Linter } from '@nrwl/linter';
import * as path from 'path';
import { NormalizedSchema, Schema } from './schema';

function addProjectFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    tmpl: '',
  };
  generateFiles(host, path.join(__dirname, 'project-files'), options.projectRoot, templateOptions);
}

function addComposeFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    tmpl: '',
  };
  generateFiles(host, path.join(__dirname, 'compose-files'), '.compose', templateOptions);
}

function addOpenshiftFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    tmpl: '',
  };
  generateFiles(host, path.join(__dirname, 'openshift-files'), '.openshift', templateOptions);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default async function (host: Tree, { name, displayName, port }: Schema) {
  const { fileName, className } = names(name);
  const projectName = fileName;
  const serviceDisplayName = displayName || className;
  const api = fileName.split('-')[0] || 'api';
  const projectRoot = `${getWorkspaceLayout(host).appsDir}/${name}`;

  const options = {
    projectName,
    projectRoot,
    displayName: serviceDisplayName,
    api,
    port: port ? parseInt(port) : 3333,
  };

  await applicationGenerator(host, {
    name,
    skipFormat: true,
    skipPackageJson: true,
    js: false,
    unitTestRunner: 'jest',
    linter: Linter.EsLint,
    pascalCaseFiles: false,
  });

  host.delete(`${projectRoot}/src/environments/environment.prod.ts`);
  host.delete(`${projectRoot}/src/app/.gitkeep`);
  host.delete(`${projectRoot}/src/assets/.gitkeep`);
  host.write(`${projectRoot}/src/${api}/.gitkeep`, '');

  addProjectFiles(host, options);
  addComposeFiles(host, options);
  addOpenshiftFiles(host, options);

  const configuration = readProjectConfiguration(host, projectName);
  configuration.targets.build.options.assets = [];
  configuration.targets.build.options.webpackConfig = `apps/${projectName}/webpack.config.js`;
  configuration.targets.build.configurations.production.fileReplacements = [];
  updateProjectConfiguration(host, projectName, configuration);

  await formatFiles(host);

  return () => {
    installPackagesTask(host);
  };
}

import {
  Tree,
  formatFiles,
  installPackagesTask,
  generateFiles,
  getWorkspaceLayout,
  names,
  updateProjectConfiguration,
  readProjectConfiguration,
} from '@nx/devkit';
import { applicationGenerator } from '@nx/express';
import * as path from 'path';
import { NormalizedSchema, Schema } from './schema';

function addProjectFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    tmpl: '',
  };
  generateFiles(host, path.join(__dirname, 'project-files'), options.projectRoot, templateOptions);
}

function addOpenShiftFiles(host: Tree, options: NormalizedSchema) {
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
    port: port || 3333,
  };

  await applicationGenerator(host, {
    directory: projectRoot,
    name,
    skipFormat: true,
    skipPackageJson: true,
    js: false,
    unitTestRunner: 'jest',
    linter: 'eslint',
    pascalCaseFiles: false,
    e2eTestRunner: 'none',
  } as Parameters<typeof applicationGenerator>[1]);

  host.delete(`${projectRoot}/src/environments/environment.prod.ts`);
  host.delete(`${projectRoot}/src/app/.gitkeep`);
  host.delete(`${projectRoot}/src/assets/.gitkeep`);
  host.write(`${projectRoot}/src/${api}/.gitkeep`, '');

  addProjectFiles(host, options);
  addOpenShiftFiles(host, options);

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

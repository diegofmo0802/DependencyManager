#!/usr/bin/env node
/**
 * @author diegofmo0802 <diegofmo0802@mysaml.com>
 * @description SAML Dependency Manager CLI.
 * @license Apache-2.0
 */

import Dependency from './Dependency.js';
import DependencyFile from './DependencyFile.js';
import DebugUI from './DebugUI.js';
import DependencyValidator from './DependencyValidator.js';

const dependencyFile = 'dep.mysaml.json';

/**
 * Extracts a repository name from its URL.
 * @param repo - The repository URL.
 * @returns The repository name.
 */
const getRepoName = (repo: string) => {
    const match = repo.match(/\/([^/]+\.git)$/);
    return match ? match[1].replace('.git', '') : null;
};

async function add(this: DebugUI, command: string, args: string[]): Promise<void> {
    try {
        this.out.info(`&C(255,180,220)╭─────────────────────────────────────────────`);
        const [repo, name] = args;
        this.out.info(`&C(255,180,220)│ Adding dependency...`);
        DependencyValidator.validateRepo(repo);
        const dependencies = await DependencyFile.load(dependencyFile);
        const dependencyName = name || getRepoName(repo);
        DependencyValidator.validateName(dependencyName);
     
        if (dependencies.some(dep => dep.name === dependencyName)) throw new Error(`A dependency with the name "${dependencyName}" already exists.`);
    
        const newDep: Dependency.Dependency = { name: dependencyName, repo };
        await DependencyFile.save(dependencyFile, [...dependencies, newDep]);
        this.out.info(`&C(255,180,220)│ Added dependency "${dependencyName}".`);
    } catch (error) { this.out.error(`&C(255,180,220)│ &C1${error}`); }
    finally { this.out.info(`&C(255,180,220)╰─────────────────────────────────────────────`); }
}

async function remove(this: DebugUI, command: string, args: string[]): Promise<void> {
    try {
        this.out.info(`&C(255,180,220)╭─────────────────────────────────────────────`);
        const [identifier] = args;
        if (!identifier) throw new Error('Usage: dep remove <name_or_repo_url>');
        const dependencies = await DependencyFile.load(dependencyFile);
        const updatedDependencies = dependencies.filter(dep => dep.name !== identifier && dep.repo !== identifier);
        if (dependencies.length === updatedDependencies.length) throw new Error(`Dependency "${identifier}" not found.`);
        await DependencyFile.save(dependencyFile, updatedDependencies);
        this.out.info(`&C(255,180,220)│ Removed dependency "${identifier}".`);
    } catch (error) { this.out.error(`&C(255,180,220)│ &C1${error}`); }
    finally { this.out.info(`&C(255,180,220)╰─────────────────────────────────────────────`); }
}

async function output(this: DebugUI, command: string, args: string[]): Promise<void> {
    try {
        this.out.info(`&C(255,180,220)╭─────────────────────────────────────────────`);
        const [identifier, output, source] = args;
        if (!identifier || !output) throw new Error('Usage: dep output <name_or_repo_url> <output_path> <source_path>');
        const dependencies = await DependencyFile.load(dependencyFile);
        const dependency = dependencies.find(dep => dep.name === identifier || dep.repo === identifier);
        if (!dependency) throw new Error(`Dependency "${identifier}" not found.`);
        
        if (!dependency.out) {
            if (!source) dependency.out = output;
            else {
                dependency.out = {};
                dependency.out[source] = output;
            }
        } else if (typeof dependency.out === 'string') {
            if (!source) {
                const current = dependency.out;
                dependency.out = [];
                dependency.out.push(current, output);
            } else {
                const current = dependency.out;
                dependency.out = {};
                dependency.out[source] = output;
                dependency.out['/'] = current;
            } 
        } else if (Array.isArray(dependency.out)) {
            if (!source) dependency.out.push(output);
            else {
                const current = dependency.out;
                dependency.out = {};
                dependency.out[source] = output;
                dependency.out['/'] = current;;
            }
        } else {
            if (!source) {
                const current = dependency.out['/'];
                if (typeof current === 'string') dependency.out['/'] = [current, output];
                else if (Array.isArray(current)) dependency.out['/'] = [...current, output];
            } else {
                const current = dependency.out[source];
                if (typeof current === 'string') dependency.out[source] = [current, output];
                else if (Array.isArray(current)) dependency.out[source] = [...current, output];
            }
        }
        await DependencyFile.save(dependencyFile, dependencies);
        this.out.info(`&C(255,180,220)│ Updated dependency output from &C4${identifier}`);
    } catch (error) { this.out.error(`&C(255,180,220)│ &C1${error}`); }
    finally { this.out.info(`&C(255,180,220)╰─────────────────────────────────────────────`); }
}

async function install(this: DebugUI, command: string, args: string[]): Promise<void> {
    try {
        this.out.info(`&C(255,180,220)╭─────────────────────────────────────────────`);
        const dependencies = await DependencyFile.load(dependencyFile)
        const toInstall = args.length > 0
            ? dependencies.filter(dep => args.includes(dep.name) || args.includes(dep.repo))
            : dependencies;

        if (toInstall.length === 0) throw new Error(args.length > 0 ? 'Specified dependencies not found.' : 'No dependencies to install.');

        let isFirst = true;
        for (const data of toInstall) {
            if (!isFirst) this.out.info(`&C(255,180,220)│`); else isFirst = false;
            this.out.info(`&C(255,180,220)│ &C3Installing dependency: &C3${data.name}`);
            const dependency = new Dependency(data);
            const result = await dependency.install();
            this.out.info(`&C(255,180,220)│ ${result.join('\n').replace(/\n/g, '\n&C(255,180,220)│ ')}`);
            this.out.info(`&C(255,180,220)│ &C3Installed dependency: &C3${data.name}`);
        }
    } catch (error) { this.out.error(`&C(255,180,220)│ &C1${error}`); }
    finally { this.out.info(`&C(255,180,220)╰─────────────────────────────────────────────`); }
}

async function uninstall(this: DebugUI, command: string, args: string[]): Promise<void> {
    try {
        this.out.info(`&C(255,180,220)╭─────────────────────────────────────────────`);
        const dependencies = await DependencyFile.load(dependencyFile);
        const toUninstall = args.length > 0
            ? dependencies.filter(dep => args.includes(dep.name) || args.includes(dep.repo))
            : dependencies;

        if (toUninstall.length === 0) throw new Error(args.length > 0 ? 'Specified dependencies not found.' : 'No dependencies to uninstall.');

        let isFirst = true;
        for (const data of toUninstall) {
            if (!isFirst) this.out.info(`&C(255,180,220)│`); else isFirst = false;
            this.out.info(`&C(255,180,220)│ &C3Uninstalling dependency: &C3${data.name}`);
            const dependency = new Dependency(data);
            const result = await dependency.uninstall();
            this.out.info(`&C(255,180,220)│ ${result.join('\n').replace(/\n/g, '\n&C(255,180,220)│ ')}`);
        }
    } catch (error) { this.out.error(`&C(255,180,220)│ &C1${error}`); }
    finally { this.out.info(`&C(255,180,220)╰─────────────────────────────────────────────`); }
}

async function list(this: DebugUI): Promise<void> {
    const dependencies: Dependency.Dependency[] = await DependencyFile.load(dependencyFile);
    if (dependencies.length === 0) {
        this.out.info('No dependencies found.');
        return;
    }
    this.out.info('&C(255,180,220)╭─────────────────────────────────────────────');
    this.out.info(`&C(255,180,220)│ &C3Dependencies:`);
    for (const dependency of dependencies) {
        this.out.info(`&C(255,180,220)│   - &C3${dependency.name}: &C2${dependency.repo}`);
    }
    this.out.info('&C(255,180,220)╰─────────────────────────────────────────────');
}


const cli = new DebugUI();
cli.addCommand('list', list, { description: 'Lists all configured dependencies.', usage: 'list' });
cli.addCommand('install', install, { description: 'Installs all or specific dependencies.', usage: 'install [name...]' });
cli.addCommand('add', add, { description: 'Adds a new dependency.', usage: 'add <repo_url> [name]' });
cli.addCommand('output', output, { description: 'Sets the output path for a dependency.', usage: 'output <name_or_repo_url> <output_path> [source_path]' });
cli.addCommand('remove', remove, { description: 'Removes a dependency.', usage: 'remove <name_or_repo_url>' });
cli.addCommand('uninstall', uninstall, { description: 'Uninstalls all or specific dependencies.', usage: 'uninstall [name...]' });
try {
    // const command = process.argv[0];
    const skip = 2; // command.trim().toLowerCase() == 'npx' ? 2 : 1;
    const [commandName, ...args] = process.argv.slice(skip);

    if (commandName) {
        const command = cli.getCommand(commandName);
        if (command) {
            await command.exec.call(cli, commandName, args);
        } else {
            cli.out.error(`Unknown command: ${commandName}`);
            cli.getCommand('help')?.exec.call(cli, 'help', []);
        }
    } else cli.start();
} catch (error) {
    cli.out.error(`&C(255,180,220)╭─────────────────────────────────────────────`);
    cli.out.error(`&C(255,180,220)│ &C1${error}`);
    cli.out.error(`&C(255,180,220)╰─────────────────────────────────────────────`);
    process.exit(1)
}
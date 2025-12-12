import Dependency from './Dependency.js';

export class DependencyValidator {
    /**
     * Validates the 'name' property.
     * @param name The 'name' property to validate.
     * @returns `true` if valid, otherwise throws an error.
     */
    public static validateName(name: any): asserts name is string {
        if (name === null || name === undefined) throw new Error('Dependency is missing a name');
        if (typeof name !== 'string') throw new Error('Dependency name is not a string.');
        if (name.length === 0) throw new Error('Dependency name is empty.');
        return;
    }
    /**
     * Validates the repository URL.
     * @param repo The repository URL to validate.
     * @returns `true` if valid, otherwise throws an error.
     * @throws Error if the repository URL is invalid.
     */
    public static validateRepo(repo: any): asserts repo is Dependency.repo  {
        if (repo === null || repo === undefined) throw new Error('Dependency is missing a repo');
        if (typeof repo !== 'string') throw new Error('Dependency repo is not a string.');
        if (!/^https:\/\/github\.com\/[^\/]+\/[^\/]+(?:\.git)?$/.test(repo)) throw new Error(`Dependency repo "${repo}" is not a valid github repo URL.`);
        return;
    }
    /**
     * Validates the 'branch' property.
     * @param branch The 'branch' property to validate.
     * @returns `true` if valid, otherwise throws an error.
     */
    public static validateBranch(branch: any): asserts branch is string | null | undefined {
        if (branch === null || branch === undefined) return;
        if (typeof branch !== 'string') throw new Error('Dependency branch is not a string.');
        if (branch.length === 0) throw new Error('Dependency branch is empty.');
        return;
    }
    /**
     * Validates the 'out' property.
     * @param out The 'out' property to validate.
     * @returns `true` if valid, otherwise throws an error.
     */
    public static validateOut(out: any): asserts out is Dependency.builderType | null | undefined {
        if (out === null || out === undefined) return;
        if (typeof out !== 'string' && !Array.isArray(out) && typeof out !== 'object') throw new Error('Dependency "out" property must be a string, an array of strings, or a valid builder object.');
        if (typeof out === 'string' && out.length === 0) throw new Error('Dependency "out" property is empty.');
        if (Array.isArray(out) && out.some(folder => typeof folder !== 'string')) throw new Error('Dependency "out" property must be an array of strings.');
        if (typeof out === 'object' && !Array.isArray(out)) for (const key in out) {
            const folders = out[key];
            if (typeof folders !== 'string' && !Array.isArray(folders)) throw new Error('Dependency "out" property must be a string, an array of strings, or a valid builder object.');
            if (Array.isArray(folders) && folders.some(folder => typeof folder !== 'string')) throw new Error('Dependency "out" property must be an array of strings.');
        }
        return;
    }
    /**
     * Validates a full dependency definition object.
     * @param data The dependency data to validate.
     * @returns `true` if valid, otherwise throws an error.
     */
    public static validateDependency(data: any): asserts data is Dependency.Dependency {
        if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error('Dependency definition must be an object.');

        this.validateName(data.name);
        this.validateRepo(data.repo);
        this.validateBranch(data.branch);
        this.validateOut(data.out);
    }
}

export default DependencyValidator;

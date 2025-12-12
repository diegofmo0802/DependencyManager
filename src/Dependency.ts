import { promises as FS } from "fs";

import Git from "./Git.js";
import File from "File.js";

export class Dependency implements Dependency.Dependency {
    public static include: string[] = [ '*' ];
    public readonly name: string;
    public readonly repo: Dependency.repo;
    public readonly branch?: string;
    public readonly out?: string | string[] | Dependency.Builder;
    /**
     * Create a new dependency
     * @param dependency Dependency to create
     * @param logger Logger to use
     * @returns New dependency
     */
    public constructor(dependency: Dependency.Dependency) {
        this.name = dependency.name;
        this.repo = dependency.repo;
        this.branch = dependency.branch;
        this.out = dependency.out;
    }
    /** Get the folder of the dependency */
    public get folder(): string {
        return this.name.startsWith('.') ? this.name : `.dep/${this.name}`;
    }
    /**
     * Clone a dependency
     * @param options Options to use
     * @returns Promise<void>
     */
    public async clone(options: Dependency.manageOptions = {}): Promise<string> {
        if (await File.exists(this.folder)) {
            if (!options.force) return await this.pull();
            else await this.uninstall();
        }
        return await Git.clone(this.repo, this.folder, this.branch);
    }
    /**
     * Pull a dependency
     * @returns Promise<void>
     */
    public async pull(): Promise<string> {
        return await Git.pull(this.folder, this.branch);
    }
    /**
     * Install a dependency
     * @param options Options to use
     * @returns Promise<void>
     */
    public async install(): Promise<string[]> {
        const output: string[] = [];
        try {
            const cloneResult = await this.clone();
            output.push(cloneResult);
            if (typeof this.out === 'string' || Array.isArray(this.out)) {
                const moveResult = await this.moveFiles(this.out);
                output.push(...moveResult);
            } else for (const source in this.out) {
                const folders = this.out[source];
                const moveResult = await this.moveFiles(folders, source);
                output.push(...moveResult);
            }
            return output;
        } catch (error) { throw error; }
    }
    /**
     * Uninstall a dependency
     * @returns Promise<void>
     */
    public async uninstall(): Promise<string[]> {
        try {
            const output: string[] = [];
            const out = typeof this.out === 'string' ? [ this.out ] : this.out ?? [];
            const folders: string[] = [ this.folder, ...Dependency.getAllOutFolders(out) ];
            for (const folder of folders) {
                if (!await File.exists(folder)) continue;
                output.push(`Removing &C4${folder}`);
                await FS.rm(folder, { recursive: true });
            }
            return output;
        } catch (error) { throw error; }
    }
    /**
     * Move files from a dependency
     * @param destination Destination folder
     * @param source Source folder
     * @returns The output of the operation
     */
    protected async moveFiles(destination: string | string[], source: string = '*'): Promise<string[]> {
        const output: string[] = [];
        destination = Array.isArray(destination) ? destination : [ destination ];
        source = Dependency.getSourcePath(this.folder, source);
        for (const folder of destination) {
            try {
                if (!await File.exists(source)) throw new Error(`Source path ${source} does not exist.`);
                if (!await File.exists(folder)) {
                    if (!await File.isFile(source)) await FS.mkdir(folder, { recursive: true });
                    else {
                        const toCreate = folder.slice(0, folder.lastIndexOf('/'));
                        if (!await File.exists(toCreate)) await FS.mkdir(toCreate, { recursive: true });
                    }
                }
                output.push(`&RMoving source &C4${source} &Rto &C4${folder}`);
                await FS.cp(source, folder, { recursive: true, force: true });
            } catch (error) { throw new Error(`Failed to move files from ${this.name} to ${folder}, \n${error}`); }
        }
        return output;
    }
    /**
     * Get the source path of a dependency
     * @param source Source path
     * @returns Source path
     */
    public static getSourcePath(folder: string, source: string = '*'): string {
        source = source.startsWith('/') ? source.slice(1) : source;
        folder = folder.endsWith('/') ? folder.slice(0, -1) : folder;
        return `${folder}/${source}`.replace(/ /g, '\\ ');
    }
    /**
     * Get all folders of a dependency
     * @param builder Builder to get folders from
     * @returns Folders
     */
    public static getAllOutFolders(builder: Dependency.builderType): string[] {
        const folders: string[] = [];
        if (typeof builder === 'string') folders.push(builder);
        else if (Array.isArray(builder)) folders.push(...builder);
        else for (const key in builder) {
            const out = this.getAllOutFolders(builder[key]);
            folders.push(...out);
        } return folders;
    }
}

export namespace Dependency {
    export type logCallback = (messages: string[]) => void;
    export type repo = `https://github.com/${string}/${string}.git`;
    export type builderType = string | string[] | Builder;
    export interface Builder { [key: string]: string | string[] }
    export interface Dependency { name: string; repo: repo; branch?: string; out?: builderType; }
    export interface manageOptions { force?: boolean; }
}

export default Dependency;

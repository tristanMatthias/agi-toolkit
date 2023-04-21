import { Module } from "../Module/Module";
import { ModuleConfiguration } from "../Module/ModuleConfiguration";
import { ModuleConfigurationFile } from "../Module/types";
import { Container } from "./Container";

// TODO: Implement agi.module.yml loading as opposed to just importing the file
/**
 * Loads a module from the given URI. The URI could be a local path or a remote URL.
 * @param moduleURI The URI of the module to load
 */
export default async function(
  moduleURI: string,
  container: Container,
  args?: Record<string, any>
): Promise<[ModuleConfigurationFile, Module]> {

  if (moduleURI.startsWith("http")) {
    // TODO: Implement remote module loading
    throw new Error("Remote module loading not yet implemented")
  }

  // Load from the local filesystem
  if (moduleURI.startsWith("./") || moduleURI.startsWith('/')) {
    const config = new ModuleConfiguration(moduleURI, container);
    const module = await config.initialize(args ?? {});
    return [config.config, module];
  }

  // TODO: Implement module loading from NPM/pip
  throw new Error(`Invalid module URI: ${moduleURI}`);
}

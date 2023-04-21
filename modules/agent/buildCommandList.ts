import { RegistryManifest } from "@agi-toolkit/Registry";

export default function(manifest: RegistryManifest): string[] {
  return Object.entries(manifest.commands).map(([name, cmd]) => {
    return `${name}(${Object.entries(cmd.params)
      .map(([name, type]) => `${name}: ${type}`)
      .join(", ")})\n`;
  });
}

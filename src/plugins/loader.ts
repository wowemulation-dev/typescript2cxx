/**
 * Plugin loader
 */

import type { Plugin } from "./types.ts";

/**
 * Load plugins by name
 */
export async function loadPlugins(pluginNames: string[]): Promise<Plugin[]> {
  const plugins: Plugin[] = [];

  for (const name of pluginNames) {
    try {
      const plugin = await loadPlugin(name);
      plugins.push(plugin);
    } catch (error) {
      console.warn(`Failed to load plugin "${name}":`, error);
    }
  }

  return plugins;
}

/**
 * Load a single plugin
 */
async function loadPlugin(nameOrPath: string): Promise<Plugin> {
  // Check if it's a built-in plugin
  if (nameOrPath === "game-engine") {
    // Load the game engine plugin example
    const module = await import("../../examples/plugins/game-engine-plugin.ts");
    return module.gameEnginePlugin;
  }

  // Try to load as a path
  // NOTE: Dynamic imports are required for plugin loading at runtime.
  // JSR will warn about this, but it's intentional and plugins must be
  // provided as absolute paths or URLs when used from JSR packages.
  if (nameOrPath.startsWith(".") || nameOrPath.startsWith("/")) {
    const module = await import(nameOrPath);
    return module.default || module.plugin;
  }

  // Try to load from JSR or other registry
  // TODO: Implement registry loading

  throw new Error(`Plugin not found: ${nameOrPath}`);
}

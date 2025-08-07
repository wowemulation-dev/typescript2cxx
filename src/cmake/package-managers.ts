/**
 * Package manager configuration generators
 */

import type { ConanConfig, VcpkgConfig } from "../config/types.ts";

/**
 * Generate vcpkg.json manifest file
 */
export function generateVcpkgManifest(config: VcpkgConfig): string {
  const manifest = {
    name: "typescript2cxx-project",
    version: "1.0.0",
    dependencies: config.requires.map((pkg) => {
      if (typeof pkg === "string") {
        return pkg;
      }
      // Handle feature specifications if needed in the future
      return pkg;
    }),
  };

  // Add features if specified
  if (config.features && Object.keys(config.features).length > 0) {
    const featuresObj: Record<string, unknown> = {};
    for (const [feature, enabled] of Object.entries(config.features)) {
      if (enabled) {
        featuresObj[feature] = {};
      }
    }
    if (Object.keys(featuresObj).length > 0) {
      (manifest as any).features = featuresObj;
    }
  }

  return JSON.stringify(manifest, null, 2);
}

/**
 * Generate conanfile.txt
 */
export function generateConanfile(config: ConanConfig): string {
  const lines: string[] = [];

  // Requirements section
  if (config.requires.length > 0) {
    lines.push("[requires]");
    for (const req of config.requires) {
      lines.push(req);
    }
    lines.push("");
  }

  // Generators section
  if (config.generators && config.generators.length > 0) {
    lines.push("[generators]");
    for (const gen of config.generators) {
      lines.push(gen);
    }
    lines.push("");
  }

  // Options section
  if (config.options && Object.keys(config.options).length > 0) {
    lines.push("[options]");
    for (const [key, value] of Object.entries(config.options)) {
      lines.push(`${key}=${value}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generate conanfile.py for advanced Conan usage
 */
export function generateConanfilePy(config: ConanConfig, projectName: string): string {
  const className = projectName.charAt(0).toUpperCase() + projectName.slice(1) + "Conan";

  return `from conan import ConanFile
from conan.tools.cmake import CMakeToolchain, CMakeDeps, cmake_layout
from conan.tools.files import copy

class ${className}(ConanFile):
    name = "${projectName.toLowerCase()}"
    version = "1.0.0"
    
    settings = "os", "compiler", "build_type", "arch"
    
    def requirements(self):
${config.requires.map((req) => `        self.requires("${req}")`).join("\n")}
    
    def configure(self):
        # Configure options if needed
        pass
    
    def layout(self):
        cmake_layout(self)
    
    def generate(self):
        deps = CMakeDeps(self)
        deps.generate()
        
        tc = CMakeToolchain(self)
        tc.generate()
`;
}

/**
 * Generate CMakePresets.json for vcpkg integration
 */
export function generateCMakePresets(config: VcpkgConfig): string {
  const presets = {
    version: 3,
    configurePresets: [
      {
        name: "vcpkg",
        displayName: "vcpkg Configuration",
        description: "Configure with vcpkg toolchain",
        binaryDir: "${sourceDir}/build",
        toolchainFile: "$env{VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake",
        cacheVariables: {
          CMAKE_BUILD_TYPE: "Release",
        } as Record<string, unknown>,
      },
      {
        name: "vcpkg-debug",
        displayName: "vcpkg Debug Configuration",
        description: "Configure with vcpkg toolchain for debugging",
        binaryDir: "${sourceDir}/build-debug",
        toolchainFile: "$env{VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake",
        cacheVariables: {
          CMAKE_BUILD_TYPE: "Debug",
        } as Record<string, unknown>,
      },
    ],
    buildPresets: [
      {
        name: "vcpkg-release",
        configurePreset: "vcpkg",
      },
      {
        name: "vcpkg-debug",
        configurePreset: "vcpkg-debug",
      },
    ],
  };

  // Add triplet if specified
  if (config.triplet) {
    presets.configurePresets[0].cacheVariables.VCPKG_TARGET_TRIPLET = config.triplet;
    presets.configurePresets[1].cacheVariables.VCPKG_TARGET_TRIPLET = config.triplet;
  }

  return JSON.stringify(presets, null, 2);
}

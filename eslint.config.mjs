import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  globalIgnores(["node_modules/", "vault/", "dist/"]),
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts,cts,js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: {
        sourceType: "module",
        projectService: {
          allowDefaultProject: ["eslint.config.*", "*.mjs"],
        },
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
      "@typescript-eslint/ban-ts-comment": "off",
      "no-prototype-builtins": "off",
      "@typescript-eslint/no-empty-function": "off",
    },
  },
  {
    // Dev tooling run by Node; never bundled into the plugin.
    files: ["*.mjs"],
    rules: {
      "obsidianmd/no-nodejs-modules": "off",
      "obsidianmd/hardcoded-config-path": "off",
    },
  },
]);

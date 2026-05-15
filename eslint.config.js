// Minimal ESLint flat config — catches broken JS, undefined vars, etc.
// Students rarely need to touch this.
import globals from "globals";

export default [
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-dupe-keys": "error",
    },
  },
  {
    ignores: ["node_modules/", ".vercel/", "dist/"],
  },
];

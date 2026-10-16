import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const reactHooksPlugin = nextVitals[0]?.plugins?.['react-hooks'];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      ...(reactHooksPlugin ? { 'react-hooks': reactHooksPlugin } : {}),
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      ...(reactHooksPlugin ? {
        "react-hooks/set-state-in-effect": "off",
        "react-hooks/static-components": "off",
        "react-hooks/immutability": "off",
        "react-hooks/exhaustive-deps": "warn",
      } : {}),
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.cjs",
  ]),
]);

export default eslintConfig;

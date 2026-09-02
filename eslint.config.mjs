import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // e2e/**: el `use()` de las fixtures de Playwright no es un React Hook,
    // pero react-hooks/rules-of-hooks lo confunde por el nombre — no hay
    // JSX ni componentes ahí, así que se excluye entero.
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "diseño/**", "coverage/**", "e2e/**", "playwright-report/**"],
  },
];

export default eslintConfig;

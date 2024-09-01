import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts", // Entry point of your TypeScript files
  output: {
    file: "./index.mjs", // Output file
    format: "es", // Output format as ES module
    sourcemap: true, // Enable sourcemaps
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      target: "ESNext", // Ensure this matches your tsconfig.json
      module: "ESNext",
    }),
  ],
};

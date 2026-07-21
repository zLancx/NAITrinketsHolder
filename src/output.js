export const EXIT_OK = 0;
export const EXIT_ERROR = 1;
export const EXIT_USAGE = 2;

export function log(...args) {
  console.log(...args);
}

export function err(...args) {
  console.error(...args);
  process.exitCode = EXIT_ERROR;
}

export function usageError(...args) {
  console.error(...args);
  process.exitCode = EXIT_USAGE;
}

export function pad(str, width) {
  return String(str).padEnd(width);
}

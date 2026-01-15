/**
 * CLI prompt utilities for user interaction
 */

import * as readline from "readline";
import { style } from "./output.js";

/**
 * Create readline interface for prompting
 */
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt user for confirmation (yes/no)
 */
export async function confirm(message: string, defaultValue: boolean = false): Promise<boolean> {
  const rl = createInterface();
  const hint = defaultValue ? "[Y/n]" : "[y/N]";

  return new Promise((resolve) => {
    rl.question(`${message} ${style.dim(hint)} `, (answer) => {
      rl.close();
      const normalized = answer.toLowerCase().trim();

      if (normalized === "") {
        resolve(defaultValue);
      } else {
        resolve(normalized === "y" || normalized === "yes");
      }
    });
  });
}

/**
 * Prompt user to type specific text to confirm
 */
export async function confirmWithText(
  message: string,
  requiredText: string = "yes"
): Promise<boolean> {
  const rl = createInterface();

  return new Promise((resolve) => {
    rl.question(`${message}\n  Type '${requiredText}' to confirm: `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === requiredText.toLowerCase());
    });
  });
}

/**
 * Prompt user for text input
 */
export async function input(message: string, defaultValue?: string): Promise<string> {
  const rl = createInterface();
  const hint = defaultValue ? ` ${style.dim(`[${defaultValue}]`)}` : "";

  return new Promise((resolve) => {
    rl.question(`${message}${hint}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

/**
 * Choice option for selection prompts
 */
export interface Choice<T> {
  label: string;
  value: T;
  key?: string;
}

/**
 * Prompt user to select from choices
 */
export async function select<T>(message: string, choices: Choice<T>[]): Promise<T> {
  const rl = createInterface();

  console.log(message);
  console.log();

  choices.forEach((choice, i) => {
    const key = choice.key || String(i + 1);
    console.log(`  [${style.cyan(key)}] ${choice.label}`);
  });

  console.log();

  return new Promise((resolve) => {
    rl.question("Your choice: ", (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();

      // Try to match by key
      const byKey = choices.find((c) => (c.key || "").toLowerCase() === normalized);
      if (byKey) {
        resolve(byKey.value);
        return;
      }

      // Try to match by number
      const num = parseInt(normalized, 10);
      if (!isNaN(num) && num >= 1 && num <= choices.length) {
        resolve(choices[num - 1].value);
        return;
      }

      // Default to first choice
      resolve(choices[0].value);
    });
  });
}

/**
 * Prompt for multi-select (checkboxes)
 */
export async function multiSelect<T>(message: string, choices: Choice<T>[]): Promise<T[]> {
  const rl = createInterface();

  console.log(message);
  console.log(style.dim("  Enter numbers separated by commas, or 'all' for all choices"));
  console.log();

  choices.forEach((choice, i) => {
    console.log(`  [${i + 1}] ${choice.label}`);
  });

  console.log();

  return new Promise((resolve) => {
    rl.question("Your choices: ", (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();

      if (normalized === "all") {
        resolve(choices.map((c) => c.value));
        return;
      }

      const nums = normalized
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= choices.length);

      const selected = nums.map((n) => choices[n - 1].value);
      resolve(selected);
    });
  });
}

/**
 * Display a progress spinner (simple)
 */
export function spinner(message: string): { stop: (finalMessage?: string) => void } {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  let running = true;

  const interval = setInterval(() => {
    if (running) {
      process.stdout.write(`\r${style.cyan(frames[i])} ${message}`);
      i = (i + 1) % frames.length;
    }
  }, 80);

  return {
    stop: (finalMessage?: string) => {
      running = false;
      clearInterval(interval);
      process.stdout.write("\r" + " ".repeat(message.length + 3) + "\r");
      if (finalMessage) {
        console.log(finalMessage);
      }
    },
  };
}

/**
 * Conflict resolution choice type
 */
export type ConflictResolution = "keep" | "replace" | "merge";

/**
 * Prompt for conflict resolution
 */
export async function promptConflictResolution(filePath: string): Promise<ConflictResolution> {
  return select<ConflictResolution>(`Conflict detected: ${style.cyan(filePath)}`, [
    { label: "Keep existing", value: "keep", key: "k" },
    { label: "Replace with new", value: "replace", key: "r" },
    { label: "Merge (attempt automatic)", value: "merge", key: "m" },
  ]);
}

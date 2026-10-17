import type { Evaluation, GameElement, Letter, State, WordLists } from "./types";

function getGameRoot(): ShadowRoot {
  const game = document.querySelector("game-app");
  if (!game || !game.shadowRoot) {
    throw new Error("Game not found");
  }
  return game.shadowRoot;
}

export function getKeyboardKey(letter: Letter | "↵" | "←"): HTMLButtonElement {
  const gameRoot = getGameRoot();
  const keyboard = gameRoot.querySelector("game-keyboard");
  if (!keyboard || !keyboard.shadowRoot) {
    throw new Error("Keyboard not found");
  }

  const key = keyboard.shadowRoot.querySelector<HTMLButtonElement>(`button[data-key="${letter}"]`);
  if (!key) {
    throw new Error(`Keyboard key not found: ${letter}`);
  }
  return key;
}

export async function getAllWords(): Promise<WordLists> {
  const response = await fetch("/main.js");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const source = await response.text();
  const solutions = readWordList(source, "SOLUTION_LIST");
  const otherGuesses = readWordList(source, "WORD_LIST");
  const allowedGuesses = solutions.slice();
  for (const word of otherGuesses) {
    if (!allowedGuesses.includes(word)) {
      allowedGuesses.push(word);
    }
  }
  return { solutions, allowedGuesses };
}

function readWordList(source: string, name: string): string[] {
  const pattern = new RegExp("\\b" + name + "\\s*=\\s*(\\[[^\\]]*\\])");
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Word list format changed: ${name}`);
  }

  const words: unknown = JSON.parse(match[1]);
  if (!Array.isArray(words) || words.length === 0) {
    throw new Error(`Word list is empty or invalid: ${name}`);
  }

  const solutions: string[] = [];
  for (const word of words) {
    if (typeof word !== "string" || !/^[a-z]{5}$/.test(word)) {
      throw new Error("Invalid solution word");
    }
    if (!solutions.includes(word)) {
      solutions.push(word);
    }
  }
  return solutions;
}

export async function waitForGame(): Promise<void> {
  for (let attempt = 0; attempt < 150; attempt++) {
    const game = document.querySelector("game-app");
    if (game && game.shadowRoot) {
      const helpButton = game.shadowRoot.querySelector("#help-button");
      if (helpButton) {
        return;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Game header did not load within 15 seconds");
}

export function addRobotButton(
  callback: (event: MouseEvent) => void
): HTMLButtonElement {
  if (typeof callback !== "function") {
    throw new TypeError("callback must be a function");
  }

  const gameRoot = getGameRoot();
  const helpButton = gameRoot.querySelector<HTMLButtonElement>("#help-button");
  if (!helpButton) {
    throw new Error("Help button not found");
  }

  let robotButton = gameRoot.querySelector<HTMLButtonElement>("#robot-button");

  if (!robotButton) {
    robotButton = helpButton.cloneNode(false) as HTMLButtonElement;
    robotButton.id = "robot-button";
    robotButton.type = "button";
    robotButton.setAttribute("aria-label", "Robot");
    robotButton.title = "Robot";
    robotButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="24" height="24" viewBox="0 0 24 24"
           aria-hidden="true" focusable="false">
        <g fill="none" stroke="var(--color-tone-3)"
           stroke-width="2" stroke-linecap="round"
           stroke-linejoin="round">
          <path d="M12 4v3M3 12v5M21 12v5"/>
          <rect x="6" y="7" width="12" height="14" rx="3"/>
          <path d="M9 17h6"/>
        </g>
        <g fill="var(--color-tone-3)">
          <circle cx="12" cy="3" r="2"/>
          <circle cx="9.5" cy="12" r="1.5"/>
          <circle cx="14.5" cy="12" r="1.5"/>
        </g>
      </svg>`;
    helpButton.after(robotButton);
  }

  robotButton.onclick = callback;
  return robotButton;
}

function getTiles(row: Element): NodeListOf<Element> {
  if (!row.shadowRoot) {
    throw new Error("Game row not found");
  }
  const tiles = row.shadowRoot.querySelectorAll("game-tile");
  if (tiles.length !== 5) {
    throw new Error("Expected a five-letter board");
  }
  return tiles;
}

function isEvaluated(row: Element): boolean {
  for (const tile of getTiles(row)) {
    const result = tile.getAttribute("evaluation");
    if (result !== "correct" && result !== "present" && result !== "absent") {
      return false;
    }
  }
  return true;
}

export function extractState(): State {
  const gameRoot = getGameRoot();
  const rows = gameRoot.querySelectorAll("#board game-row");
  if (rows.length === 0) {
    throw new Error("Game board not found");
  }

  const state: State = {
    guessesRemain: rows.length,
    guesses: [],
  };

  for (const row of rows) {
    if (!isEvaluated(row)) {
      continue;
    }

    let word = "";
    const evaluation: Evaluation[] = [];
    for (const tile of getTiles(row)) {
      const letter = tile.getAttribute("letter");
      if (!letter || !/^[a-z]$/.test(letter)) {
        throw new Error("Invalid tile letter");
      }
      word += letter;
      evaluation.push(tile.getAttribute("evaluation") as Evaluation);
    }

    state.guessesRemain--;
    state.guesses.push({ word, evaluation });
  }
  return state;
}

export function enterGuess(word: string): void {
  if (!/^[a-z]{5}$/.test(word)) {
    throw new Error("No valid next guess found");
  }

  const game = document.querySelector<GameElement>("game-app");
  if (!game || !game.canInput || game.gameStatus !== "IN_PROGRESS") {
    throw new Error("Game is not ready for a guess");
  }

  const gameRoot = getGameRoot();
  const openDialog = gameRoot.querySelector("game-modal[open], game-page[open]");
  if (openDialog) {
    throw new Error("Close the open dialog first");
  }

  const rows = gameRoot.querySelectorAll("#board game-row");
  let currentRow: Element | null = null;
  for (const row of rows) {
    if (!isEvaluated(row)) {
      currentRow = row;
      break;
    }
  }

  if (!currentRow) {
    throw new Error("No guesses remain");
  }
  if (currentRow.getAttribute("letters")) {
    throw new Error("Clear the current guess before using Robot");
  }

  const letterKeys: HTMLButtonElement[] = [];
  for (const letter of word) {
    letterKeys.push(getKeyboardKey(letter as Letter));
  }
  const enterKey = getKeyboardKey("↵");

  for (const key of letterKeys) {
    key.click();
  }
  if (currentRow.getAttribute("letters") !== word) {
    throw new Error("The game did not accept the letter clicks");
  }

  enterKey.click();
  if (!isEvaluated(currentRow)) {
    throw new Error("The game rejected the guess; check its message");
  }
}


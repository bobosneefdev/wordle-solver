// ==UserScript==
// @name         Wordle Solver
// @namespace    https://github.com/bobosneefdev/wordle-solver
// @version      2.0.3
// @description  Automatic and hopefully optimal Wordle solving script for WordleUnlimited.org
// @match        https://wordleunlimited.org/*
// @grant        none
// @sandbox      raw
// @run-at       document-idle
// @downloadURL  https://github.com/bobosneefdev/wordle-solver/releases/latest/download/wordle-solver.user.js
// @updateURL    https://github.com/bobosneefdev/wordle-solver/releases/latest/download/wordle-solver.user.js
// ==/UserScript==
import { bestGuess } from "./logic";
import type { WordLists } from "./types";
import {
  addRobotButton,
  enterGuess,
  extractState,
  getAllWords,
  waitForGame,
} from "./util";

async function start() {
  await waitForGame();
  let wordLists: WordLists | undefined;
  const robotButton = addRobotButton(onRobotClick);

  async function onRobotClick() {
    robotButton.disabled = true;

    try {
      if (!wordLists) {
        wordLists = await getAllWords();
      }

      const state = extractState();
      if (state.guessesRemain === 0) {
        throw new Error("No guesses remain");
      }

      robotButton.title = "Robot: choosing a guess";
      const nextWord = await bestGuess(state, wordLists.solutions, wordLists.allowedGuesses);
      const currentState = extractState();
      if (JSON.stringify(currentState) !== JSON.stringify(state)) {
        throw new Error("The board changed while choosing a guess; click Robot again");
      }
      enterGuess(nextWord);
      console.log(`Solver: Submitted ${nextWord}`);
      robotButton.title = `Robot: submitted ${nextWord.toUpperCase()}`;
    } catch (problem) {
      console.error(problem);
      let message = String(problem);
      if (problem instanceof Error) {
        message = problem.message;
      }
      robotButton.title = `Robot: ${message}`;
    } finally {
      robotButton.disabled = false;
    }
  }
}

start().catch(console.error);

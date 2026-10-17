import type { Evaluation, State } from "./types";

export function evaluateGuess(guess: string, answer: string): Evaluation[] {
  const remainingLetters = answer.split("");
  const evaluation: Evaluation[] = [];

  for (let index = 0; index < guess.length; index++) {
    if (guess[index] === answer[index]) {
      evaluation[index] = "correct";
      remainingLetters[index] = "";
    } else {
      evaluation[index] = "absent";
    }
  }

  for (let index = 0; index < guess.length; index++) {
    if (evaluation[index] === "correct") {
      continue;
    }

    const remainingIndex = remainingLetters.indexOf(guess[index]);
    if (remainingIndex !== -1) {
      evaluation[index] = "present";
      remainingLetters[remainingIndex] = "";
    }
  }

  return evaluation;
}

function matchesPreviousGuesses(word: string, state: State): boolean {
  for (const guess of state.guesses) {
    const evaluation = evaluateGuess(guess.word, word);

    for (let index = 0; index < evaluation.length; index++) {
      if (evaluation[index] !== guess.evaluation[index]) {
        return false;
      }
    }
  }

  return true;
}

function getFeedbackCode(guess: string, answer: string, usedPositions: Uint8Array): number {
  usedPositions.fill(0);
  let feedbackCode = 0;
  let placeValue = 1;

  for (let index = 0; index < 5; index++) {
    if (guess[index] === answer[index]) {
      usedPositions[index] = 1;
      feedbackCode += 2 * placeValue;
    }
    placeValue *= 3;
  }

  placeValue = 1;
  for (let index = 0; index < 5; index++) {
    if (guess[index] !== answer[index]) {
      for (let answerIndex = 0; answerIndex < 5; answerIndex++) {
        if (usedPositions[answerIndex] === 0 && guess[index] === answer[answerIndex]) {
          usedPositions[answerIndex] = 1;
          feedbackCode += placeValue;
          break;
        }
      }
    }
    placeValue *= 3;
  }

  return feedbackCode;
}

export async function bestGuess(state: State, solutions: string[], allowedGuesses: string[]): Promise<string> {
  const possibleWords: string[] = [];
  for (const word of solutions) {
    if (matchesPreviousGuesses(word, state)) {
      possibleWords.push(word);
    }
  }
  if (possibleWords.length === 0) {
    throw new Error("No solutions match the board");
  }
  if (possibleWords.length <= 2 || state.guessesRemain === 1) {
    return possibleWords[0];
  }

  let openingCacheKey = "";
  if (state.guesses.length === 0) {
    openingCacheKey = JSON.stringify([solutions, allowedGuesses]);
    try {
      const cached = JSON.parse(localStorage.getItem("wordle-solver-opening-v1") || "null");
      if (cached && cached.key === openingCacheKey && allowedGuesses.includes(cached.word)) {
        return cached.word;
      }
    } catch {
    }
  }

  let lowestTotal = Infinity;
  let bestWord = "";
  let guessesScored = 0;
  let bestIsSolution = false;
  const solutionSet = new Set(possibleWords);
  const feedbackGroups = new Uint32Array(243);
  const usedPositions = new Uint8Array(5);

  for (const guess of allowedGuesses) {
    feedbackGroups.fill(0);
    let totalRemaining = 0;
    for (const answer of possibleWords) {
      const feedback = getFeedbackCode(guess, answer, usedPositions);
      const groupSize = feedbackGroups[feedback];
      totalRemaining += 2 * groupSize + 1;
      feedbackGroups[feedback] = groupSize + 1;
      if (totalRemaining > lowestTotal) {
        break;
      }
    }

    const isSolution = solutionSet.has(guess);

    if (totalRemaining < lowestTotal || (totalRemaining === lowestTotal && isSolution && !bestIsSolution)) {
      lowestTotal = totalRemaining;
      bestWord = guess;
      bestIsSolution = isSolution;
    }

    guessesScored++;
    if (guessesScored % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  if (openingCacheKey) {
    try {
      localStorage.setItem("wordle-solver-opening-v1", JSON.stringify({ key: openingCacheKey, word: bestWord }));
    } catch {
    }
  }

  return bestWord;
}

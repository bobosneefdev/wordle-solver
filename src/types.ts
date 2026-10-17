export type Letter =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";

export type Evaluation = "correct" | "present" | "absent";

export type Guess = {
  word: string;
  evaluation: Evaluation[];
};

export type State = {
  guessesRemain: number;
  guesses: Guess[];
};

export type WordLists = {
  solutions: string[];
  allowedGuesses: string[];
};

export interface GameElement extends HTMLElement {
  canInput: boolean;
  gameStatus: string;
}

export const keyboardLetters = (letter: string) => {
    const shadowRoot = document.querySelector("body > game-app").shadowRoot;
    const keyboardMain = shadowRoot.querySelector("game-keyboard").shadowRoot;
    const letterElement = keyboardMain.querySelector(`button[data-key="${letter}"]`) as HTMLButtonElement;
    return letterElement;
};
export const boardRowTiles = (row: number) => {
    const shadowRoot = document.querySelector("body > game-app").shadowRoot;
    const gameRowMain = shadowRoot.querySelector(`#board > game-row:nth-child(${row})`).shadowRoot;
    const letterElements = gameRowMain.querySelectorAll(".row > game-tile");
    return letterElements;
};

export const lengthOfWord = 5;

export const delayMsBetweenEntries = 1800;

export const pointBonusOnNewLetter = 1;

export const starter = "tales";
import wordsFile from './words.txt';
import * as constants from './constants';
const words = wordsFile.split(', ');
console.log("loaded words", words.length);

// START SCRIPT
createBanner();

document.getElementById('best-guess').addEventListener('click', bestGuess);

document.getElementById('quick-solve').addEventListener('click', quickSolve);

// END SCRIPT
type alphabet = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';

function bestGuess() {
    const letterInfo = getLetterInfo();
    if (letterInfo === true) {
        console.log('Word is already solved');
        return;
    }
    const mostProbableWord = getMostProbableWord(letterInfo);
    console.log('best guess:', mostProbableWord);
    guessWord(mostProbableWord.word);
};

async function quickSolve() {
    let startTimer = Date.now();

    for (let i = 0; i < 6; i++) {
        const letterInfo = getLetterInfo();
        if (letterInfo === true) {
            console.log(`Solved in ${Date.now() - startTimer}ms`);
            return;
        }

        const isFirstGuess = Object.values(letterInfo).every(letter => letter === null);
        if (isFirstGuess) {
            await guessWord(constants.starter);
            continue;
        }

        const mostProbableWord = getMostProbableWord(letterInfo);
        console.log('best guess:', mostProbableWord);
        await guessWord(mostProbableWord.word);
    }
}

async function guessWord(word: string) {
    for (const letter of word) {
        const letterButton = constants.keyboardLetters(letter);
        if (letterButton) {
            letterButton.click();
        } else {
            console.error(`Letter button for ${letter} not found`);
        }
    }
    const enterButton = constants.keyboardLetters('↵');
    if (enterButton) {
        enterButton.click();
    }
    await new Promise(resolve => setTimeout(resolve, constants.delayMsBetweenEntries));
}

function getMostProbableWord(gameLetterInfos: Record<
    alphabet,
    false | null | { count: number, definitiveCount: number, correctPositions: number[], incorrectPositions: number[] }
>) {
    let mostProbable = {
        word: '',
        score: -100,
    };

    for (const word of words) {
        // Store the key information about each letter in the word
        let guessLetterInfos: Partial<Record<alphabet, { count: number, positions: number[] }>> = {};
        for (let i = 0; i < constants.lengthOfWord; i++) {
            const alphabetLetter = word[i] as alphabet;
            if (guessLetterInfos[alphabetLetter]) {
                guessLetterInfos[alphabetLetter].count++;
                guessLetterInfos[alphabetLetter].positions.push(i);
            } else {
                guessLetterInfos[alphabetLetter] = { count: 1, positions: [i] };
            }
        }

        let score = 0;
        let validGuess = true;
        for (const [gameLetter, gameLetterInfo] of Object.entries(gameLetterInfos)) {
            const alphabetLetter = gameLetter as alphabet;
            const guessLetterInfo = guessLetterInfos[alphabetLetter];
            
            // If we know the letter is not in the word, yet it is in this guess, skip word
            if (gameLetterInfo === false && guessLetterInfo && guessLetterInfo.count > 0) {
                validGuess = false;
                break;

            // Just here to make typescript happy
            } else if (gameLetterInfo === false) {
                continue;
            }

            // If the word doesn't have enough of a given letter, skip word
            if ((guessLetterInfo?.count || 0) < (gameLetterInfo?.count || 0)) {
                validGuess = false;
                break;
            }

            // If the word doesn't have exactly the definitive count of a given letter, skip word
            if (gameLetterInfo?.definitiveCount && gameLetterInfo.definitiveCount !== guessLetterInfo?.count) {
                validGuess = false;
                break;
            }

            // Ensure known correct positions are in the word
            if (gameLetterInfo !== null) {
                for (const gameCorrectPosition of gameLetterInfo.correctPositions) {
                    if (!guessLetterInfo?.positions.includes(gameCorrectPosition)) {
                        validGuess = false;
                        break;
                    }
                }
            }
            if (!validGuess) {
                break;
            }

            // Ensure known incorrect positions are not in the word
            if (gameLetterInfo !== null) {
                for (const gameIncorrectPosition of gameLetterInfo.incorrectPositions) {
                    if (guessLetterInfo?.positions.includes(gameIncorrectPosition)) {
                        validGuess = false;
                        break;
                    }
                }
            }
            if (!validGuess) {
                break;
            }

            // Add a point for exploring new letters
            if (gameLetterInfo === null && guessLetterInfo && guessLetterInfo?.count > 0) {
                score += constants.pointBonusOnNewLetter;
            }
        }

        // If the word is valid and has a higher score than the previous most probable word, update most probable word
        if (validGuess && score > mostProbable.score) {
            mostProbable = { word, score };
        }
    }

    return mostProbable;
}


function getLetterInfo(): Record<
    alphabet,
    false | null | { count: number, definitiveCount: number, correctPositions: number[], incorrectPositions: number[] }
> | true {
    const gameInfo: Record<
        alphabet,
        false | null | { count: number, definitiveCount: number, correctPositions: number[], incorrectPositions: number[] }
    > = {
        a: null, b: null, c: null, d: null, e: null, f: null, g: null, h: null, i: null, j: null, k: null, l: null, m: null,
        n: null, o: null, p: null, q: null, r: null, s: null, t: null, u: null, v: null, w: null, x: null, y: null, z: null,
    };

    // Row elements loop
    for (let i = 1; i <= 6; i++) {
        const tileElsInRow = constants.boardRowTiles(i);

        // Flag to break loop if last filled out row
        let lastFilledOutRow = false;

        // Store how many times we see the letter in this row, if it's greater than previous guesses, overwrite, else ignore
        const letterCountsThisRow: Partial<Record<alphabet, { count: number, final: boolean }>> = {};

        // Tile elements loop
        let correctCount = 0;
        for (let tilePosition = 0; tilePosition < tileElsInRow.length; tilePosition++) {
            // Get letter of tile
            const letter = tileElsInRow[tilePosition].getAttribute('letter') as alphabet;

            // Get evaluation of tile
            const evaluation = tileElsInRow[tilePosition].getAttribute('evaluation') as "absent" | "correct" | "present" | null;

            // If the tile hasn't been filled out yet, break loop, as its impossible for later tiles to be filled out
            if (evaluation === null) {
                lastFilledOutRow = true;
                break;
            }

            if (evaluation === 'correct') {
                correctCount++;
                if (gameInfo[letter] === null) {
                    gameInfo[letter] = {
                        count: 1,
                        definitiveCount: 0,
                        correctPositions: [tilePosition],
                        incorrectPositions: []
                    };
                } else if (gameInfo[letter] !== false) {
                    gameInfo[letter].correctPositions.push(tilePosition);
                }
            } else if (evaluation === 'present') {
                if (gameInfo[letter] === null) {
                    gameInfo[letter] = {
                        count: 1,
                        definitiveCount: 0,
                        correctPositions: [],
                        incorrectPositions: [tilePosition]
                    };
                } else if (gameInfo[letter] !== false) {
                    gameInfo[letter].incorrectPositions.push(tilePosition);
                }
            }

            if (evaluation === 'correct' || evaluation === 'present') {
                letterCountsThisRow[letter] = { count: 0, final: false };
                if (letterCountsThisRow[letter].count) {
                    letterCountsThisRow[letter].count++;
                } else {
                    letterCountsThisRow[letter].count = 1;
                }
            } else if (evaluation === 'absent') {
                // If this letter will not be in the word, set to false
                if (!gameInfo[letter]) {
                    gameInfo[letter] = false;

                // If the letter is already there, that means we guessed too high of a count, and this tile is incorrect location
                } else {
                    gameInfo[letter].incorrectPositions.push(tilePosition);
                }
            }
        }

        // If all letters are correct, return true
        if (correctCount === constants.lengthOfWord) {
            return true;
        }

        // Check if we now know about a letter occurring more times than previous rows/guesses
        for (const [letter, rowCountData] of Object.entries(letterCountsThisRow)) {
            const alphabetLetter = letter as alphabet;
            if (gameInfo[alphabetLetter] !== false && gameInfo[alphabetLetter] !== null) {
                gameInfo[alphabetLetter].count = Math.max(gameInfo[alphabetLetter].count, rowCountData.count);
                if (rowCountData.final) {
                    gameInfo[alphabetLetter].definitiveCount = rowCountData.count;
                }
            }
        }

        if (lastFilledOutRow) {
            break;
        }
    }

    console.log(JSON.stringify(gameInfo, null, 4));
    return gameInfo;
}

function createBanner() {
    GM_addStyle(`
        #custom-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background-color: #333;
            color: white;
            padding-top: 10px;
            padding-bottom: 10px;
            padding-left: 33%;
            padding-right: 33%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 9999;
            box-sizing: border-box;
        }
        #custom-banner button {
            background-color: #555;
            border: none;
            color: white;
            padding: 10px 20px;
            margin: 0;
            cursor: pointer;
        }
        #custom-banner button:hover {
            background-color: #777;
        }
        #custom-banner h2 {
            margin: 0;
        }
    `);

    const banner = document.createElement('div');
    banner.id = 'custom-banner';
    banner.innerHTML = `
        <button id="best-guess">Best Guess</button>
        <h2>Wordle Solver</h2>
        <button id="quick-solve">Quick Solve</button>
    `;

    document.body.appendChild(banner);
}
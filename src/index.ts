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
    let ready = false;
    for (const word of constants.starters) {
        guessWord(word);
        const letterInfo = getLetterInfo();
        if (letterInfo === true) {
            console.log(`Solved in ${Date.now() - startTimer}ms`);
            return;
        }
        if (getMostProbableWord(letterInfo).word) {
            ready = true;
            break;
        }
        if (ready) {
            break;
        }
    }
    if (!ready) {
        console.error('No words found with the given starters');
    }
    for (let i = 0; i < 6; i++) {
        const letterInfo = getLetterInfo();
        if (letterInfo === true) {
            console.log(`Solved in ${Date.now() - startTimer}ms`);
            return;
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
    await new Promise(resolve => setTimeout(resolve, 1800));
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

            // If we don't know anything about the letter yet, skip letter check
            if (gameLetterInfo === null) {
                continue;
            
            // If we know the letter is not in the word, yet it is in this guess, skip word
            } else if (gameLetterInfo === false && guessLetterInfo && guessLetterInfo.count > 0) {
                score = 0;
                validGuess = false;
                break;

            // Just here to make typescript happy
            } else if (gameLetterInfo === false) {
                continue;
            }

            // If the word doesn't have enough of a given letter, skip word
            if (
                (guessLetterInfo?.count || 0) < gameLetterInfo.count ||
                (gameLetterInfo.definitiveCount && gameLetterInfo.definitiveCount !== guessLetterInfo?.count)
            ) {
                // console.log(`need ${gameLetterInfo.count} ${alphabetLetter}'s, have ${guessLetterInfo?.count}`);
                score = 0;
                validGuess = false;
                break;
            }

            // If a word has more than enough of a given letter, lose 0.5 points for each extra letter
            if ((guessLetterInfo?.count || 0) > gameLetterInfo.count) {
                score -= constants.pointsLostOnRepeatLetter;
            }

            // Ensure known correct positions are in the word
            for (const gameCorrectPosition of gameLetterInfo.correctPositions) {
                if (!guessLetterInfo?.positions.includes(gameCorrectPosition)) {
                    // console.log(`${alphabetLetter} not found in char ${gameCorrectPosition}`);
                    score = 0;
                    validGuess = false;
                    break;
                }
            }
            if (!validGuess) {
                break;
            }

            // Ensure known incorrect positions are not in the word
            for (const gameIncorrectPosition of gameLetterInfo.incorrectPositions) {
                if (guessLetterInfo?.positions.includes(gameIncorrectPosition)) {
                    // console.log(`${alphabetLetter} found in char ${gameIncorrectPosition}`);
                    score = 0;
                    validGuess = false;
                    break;
                }
            }
            if (!validGuess) {
                break;
            }

            score++;
        }

        // If the word is valid and has a higher score than the previous most probable word, update most probable word
        if (validGuess && score > mostProbable.score) {
            mostProbable = {
                word,
                score,
            };
        }
    }

    return mostProbable;
}


function getLetterInfo(): Record<
    alphabet,
    false | null | { count: number, definitiveCount: number, correctPositions: number[], incorrectPositions: number[] }
> | true {
    const letterInfo: Record<
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
        const letterCountsThisRow: Partial<Record<alphabet, number>> = {};

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
                if (letterInfo[letter] === null) {
                    letterInfo[letter] = {
                        count: 1,
                        definitiveCount: 0,
                        correctPositions: [tilePosition],
                        incorrectPositions: []
                    };
                } else if (letterInfo[letter] !== false) {
                    letterInfo[letter].correctPositions.push(tilePosition);
                }
            } else if (evaluation === 'present') {
                if (letterInfo[letter] === null) {
                    letterInfo[letter] = {
                        count: 1,
                        definitiveCount: 0,
                        correctPositions: [],
                        incorrectPositions: [tilePosition]
                    };
                } else if (letterInfo[letter] !== false) {
                    letterInfo[letter].incorrectPositions.push(tilePosition);
                }
            }

            if (evaluation === 'correct' || evaluation === 'present') {
                if (letterCountsThisRow[letter]) {
                    letterCountsThisRow[letter]++;
                } else {
                    letterCountsThisRow[letter] = 1;
                }
            } else if (evaluation === 'absent') {
                // If we never have confirmed the presence of the letter, set it to false
                if (!letterInfo[letter]) {
                    letterInfo[letter] = false;

                // If we have previously confirmed the presence of the letter, set definitive count
                } else {
                    letterInfo[letter].definitiveCount = letterInfo[letter].count;
                    letterInfo[letter].incorrectPositions.push(tilePosition);
                }
            }
        }

        // If all letters are correct, return true
        if (correctCount === constants.lengthOfWord) {
            return true;
        }

        // Check if we now know about a letter occurring more times than previous rows/guesses
        for (const [letter, count] of Object.entries(letterCountsThisRow)) {
            // why is typescript thinking letter is string not alphabet?
            const alphabetLetter = letter as alphabet;
            if (letterInfo[alphabetLetter] !== false && letterInfo[alphabetLetter] !== null) {
                // Overwrite count if it's greater than previous guesses
                letterInfo[alphabetLetter].count = Math.max(letterInfo[alphabetLetter].count, count);
            }
        }

        if (lastFilledOutRow) {
            break;
        }
    }

    console.log(JSON.stringify(letterInfo, null, 4));
    return letterInfo;
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
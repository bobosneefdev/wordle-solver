# Wordle Solver for wordleunlimited.org

This repository contains a Tampermonkey script designed to automatically solve Wordle games on [wordleunlimited.org](https://wordleunlimited.org). The script leverages automated logic to find the correct word based on the game's feedback mechanism.

## Features

-   Automatically solves Wordle puzzles on wordleunlimited.org.
-   Uses feedback from the game to intelligently guess the next word.
-   Designed to work with the Wordle interface on wordleunlimited.org.

## Installation

1. **Install Tampermonkey:**

    - For Chrome, visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dgngnkaabnmmcbdihbgcajamclpbmiib) and click "Add to Chrome."
    - For Firefox, visit the [Firefox Add-ons site](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) and click "Add to Firefox."

2. **Install the Script:**

    - Click the Tampermonkey extension icon in your browser toolbar.
    - Select "Create a new script."
    - Copy and paste the contents of `wordle-solver.user.js` from this repository into the Tampermonkey editor.
    - Save the script.

3. **Access the Wordle Game:**
    - Navigate to [wordleunlimited.org](https://wordleunlimited.org) in your browser.
    - Use the buttons at the top of the page within the banner to automatically solve 1 line, or the full game.

## Usage

Once the script is installed and you are on the Wordle game page, it will begin solving the game automatically. The script interacts with the game's interface to provide optimal guesses and solve the puzzle.

## Configuration

The script is designed to work out of the box. However, if you want to modify its behavior, you can edit the script directly in the Tampermonkey editor. Common configurations include adjusting the guessing strategy or altering the frequency of guesses.

## Contributing

Contributions are welcome! If you have suggestions for improvements or have found a bug, please submit an issue or a pull request. Please ensure your contributions align with the project's goals and standards.


## Disclaimer

This script is intended for educational purposes only.


---

Happy solving!

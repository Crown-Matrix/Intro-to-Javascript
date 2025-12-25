const numberButtons = document.querySelectorAll('.number-button');
const operationButtons = document.querySelectorAll('.operation-button');
const actionButtons = document.querySelectorAll('.action-button');

var Ans = "0"; // Variable to store the last answer

var equationLine = "";

numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        console.log(`Number ${button.textContent} clicked`);
        if (equationLine === "Syntax Error" || equationLine === "Calculation Error") {
            equationLine = button.textContent;
        } else {
            equationLine += button.textContent;
        }
        updateEquationDisplay();
    })
});

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        console.log(`Operation ${button.textContent} clicked`);
        if (equationLine === "Syntax Error" || equationLine === "Calculation Error") {
            equationLine = button.textContent;
        } else {
            equationLine += button.textContent;
        }
        updateEquationDisplay();
    })
});

actionButtons.forEach(button => {
    button.addEventListener('click', () => {
        console.log(`Action ${button.textContent} clicked`);
    })
});

document.getElementById("delete-button").addEventListener('click', () => {
    if (equationLine.length === 0) return;
    if (equationLine === "Syntax Error" || equationLine === "Calculation Error") {
        equationLine = "";
        updateEquationDisplay();
        return;
    }
    equationLine = equationLine.slice(0, -1);
    updateEquationDisplay();
});

document.getElementById('equals-button').addEventListener('click', () => {
    const result = evaluateEquation(equationLine);
    equationLine = result.toString();
    updateEquationDisplay();
});

document.getElementById('clear-button').addEventListener('click', () => {
    clearEquation();
    updateEquationDisplay();
});

function normalizeNumber(n) {
    if (!Number.isFinite(n)) return n;

    // Step 1: remove floating-point noise
    const cleaned = Number(n.toPrecision(15));

    // Step 2: snap near integers
    const r = Math.round(cleaned);
    return Math.abs(cleaned - r) < 1e-12 ? r : cleaned;
}



function evaluateEquation(equation) {
        function rounded(num, places) {
            const factor = Math.pow(10, places);
            return Math.round(num * factor) / factor;
        };
    try {
        equation = equation.replace(/\^/g, '**'); // Replace ^ with ** for exponentiation
        equation = equation.replace(/÷/g, '/'); // Replace division symbol with /
        equation = equation.replace(/×/g, '*'); // Replace multiplication symbol with *
        let result = eval(equation);
        if (isNaN(result)) {
            return "Imaginary Error";
        } else if (!isFinite(result)) {
            return "Undefined Error";
        }

        // purify output
        const fixed_result = normalizeNumber(result);
        if (result === fixed_result) {
            console.log("Result was fixed:", result);
            result = rounded(result, 13);
        } else {
            result = rounded(fixed_result, 13);
            console.log(`Fixed Result ${fixed_result} was rounded to: ${result}`);
        }

        Ans = result; // For Ans functionality
        return result;
    } catch (error) {
        console.error("Error evaluating equation:", error);
        return "Syntax Error";
    }
}

function clearEquation() {
    equationLine = "";
    updateEquationDisplay();
    
}

function removeBlockCharacter() {
    document.getElementById('blank-blinker').style.color = "black";
}

const unicodeValue = 9608;
document.getElementById('blank-blinker').innerText = String.fromCharCode(unicodeValue);

function insertBlockCharacter() {
    document.getElementById('blank-blinker').style.color = "white"
}

var blockBlinkInterval = setInterval(blockBlink, 500);

function blockBlink() {
    const blinker = document.getElementById('blank-blinker');
    if (equationLine === "Syntax Error" || equationLine === "Undefined Error" || equationLine === "Imaginary Error") {
        removeBlockCharacter();
        return;
    }
    if (blinker.style.color === "white") {
        removeBlockCharacter();
    } else {
        insertBlockCharacter();
    }
}

function updateEquationDisplay() {
    console.log("Updating display:", equationLine);
    if (equationLine === "") {
        insertBlockCharacter();
    } else {
        removeBlockCharacter();
    }
    const display = document.getElementById('screen-str');
    display.innerText = equationLine;
}

console.log("Calculator JS loaded");
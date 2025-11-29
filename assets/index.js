// This version uses a simpler approach without ES modules
// We'll load the libraries via script tags in HTML and use them globally

// Configuration
const CANISTER_ID = "ebwns-iiaaa-aaaam-qdtta-cai";
const HOST = "https://icp0.io";

// State
let actor = null;
let questions = [];
let currentQuestionIndex = 0;
let userGuesses = [];

// DOM Elements
const screens = {
    loading: document.getElementById('loading-screen'),
    welcome: document.getElementById('welcome-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

const ui = {
    progressBar: document.getElementById('progress-bar'),
    progressContainer: document.getElementById('progress-container'),
    carImage: document.getElementById('car-image'),
    carName: document.getElementById('car-name'),
    optionsContainer: document.getElementById('options-container'),
    scoreDisplay: document.getElementById('score-display'),
    resultMessage: document.getElementById('result-message'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn')
};

// IDL Factory
const idlFactory = ({ IDL }) => {
    const CarId = IDL.Nat;
    const Option = IDL.Record({ 'id': IDL.Nat, 'price': IDL.Nat });
    const Question = IDL.Record({
        'carId': CarId,
        'carName': IDL.Text,
        'carImage': IDL.Text,
        'options': IDL.Vec(Option),
    });
    const Guess = IDL.Record({
        'carId': CarId,
        'selectedOptionId': IDL.Nat,
    });
    const Result = IDL.Record({
        'score': IDL.Nat,
        'maxScore': IDL.Nat,
        'message': IDL.Text,
    });
    return IDL.Service({
        'getQuestions': IDL.Func([], [IDL.Vec(Question)], ['query']),
        'submitGuesses': IDL.Func([IDL.Vec(Guess)], [Result], []),
    });
};

// Initialization
async function init() {
    console.log("Starting initialization...");
    try {
        // Wait for dfinity libraries to load
        if (typeof window.ic === 'undefined' || typeof window.ic.HttpAgent === 'undefined') {
            throw new Error("Dfinity libraries not loaded. Please refresh the page.");
        }

        console.log("Creating HttpAgent with host:", HOST);
        const agent = new window.ic.HttpAgent({ host: HOST });

        console.log("Creating Actor for canister:", CANISTER_ID);
        actor = window.ic.Actor.createActor(idlFactory, {
            agent,
            canisterId: CANISTER_ID,
        });

        console.log("Actor created. Fetching questions...");
        questions = await actor.getQuestions();
        console.log("Questions loaded:", questions);

        showScreen('welcome');
    } catch (error) {
        console.error("Initialization error:", error);
        alert("Failed to connect: " + error.message);

        const loadingText = document.querySelector('#loading-screen p');
        if (loadingText) loadingText.textContent = "Error: " + error.message;
    }
}

// Navigation
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');

    if (screenName === 'game') {
        ui.progressContainer.style.display = 'block';
    } else {
        ui.progressContainer.style.display = 'none';
    }
}

// Game Logic
function startGame() {
    currentQuestionIndex = 0;
    userGuesses = [];
    updateProgress();
    renderQuestion();
    showScreen('game');
}

function updateProgress() {
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    ui.progressBar.style.width = `${progress}%`;
}

function renderQuestion() {
    if (currentQuestionIndex >= questions.length) {
        finishGame();
        return;
    }

    const question = questions[currentQuestionIndex];

    ui.carName.textContent = question.carName;
    ui.carImage.src = question.carImage;
    ui.optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        const price = Number(option.price).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        });
        btn.textContent = price;
        btn.onclick = () => selectOption(question.carId, option.id);
        ui.optionsContainer.appendChild(btn);
    });
}

function selectOption(carId, optionId) {
    userGuesses.push({
        carId: carId,
        selectedOptionId: optionId
    });

    currentQuestionIndex++;
    updateProgress();

    setTimeout(() => {
        renderQuestion();
    }, 300);
}

async function finishGame() {
    showScreen('loading');

    try {
        const result = await actor.submitGuesses(userGuesses);
        ui.scoreDisplay.textContent = result.score;
        ui.resultMessage.textContent = result.message;
        showScreen('result');
    } catch (error) {
        console.error("Error submitting guesses:", error);
        alert("Error submitting results.");
        showScreen('welcome');
    }
}

// Event Listeners
ui.startBtn.addEventListener('click', startGame);
ui.restartBtn.addEventListener('click', startGame);

// Start
window.addEventListener('load', init);

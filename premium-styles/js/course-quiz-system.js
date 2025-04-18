/**
 * Fluent Speaker Course Platform - Quiz System
 * 
 * This script provides:
 * - Interactive quiz functionality
 * - Question navigation
 * - Scoring and feedback
 * 
 * v1.0.0
 */

// Quiz System Object
const QuizSystem = {
    // Configuration
    config: {
        transitionDuration: 300, // Animation duration in ms
        autoProgressDelay: 1000, // Delay before automatically advancing (if enabled)
        showExplanations: true, // Show explanations for questions
        autoAdvance: true, // Automatically advance to next question after answering
        minPassScore: 0.7, // Minimum passing score (70%)
        enableSummary: true, // Show summary at the end
        enableReview: true // Allow reviewing answers
    },

    // State variables
    state: {
        currentIndex: 0, // Current question index
        questions: [], // Array of question objects
        answers: [], // User's answers
        isSubmitted: false, // Whether quiz has been submitted
        isInitialized: false // Whether quiz has been initialized
    },

    // Initialize quiz
    init() {
        console.log('Initializing Quiz System...');

        // Avoid double initialization
        if (this.state.isInitialized) return;

        // Find quiz container
        const quizContainer = document.querySelector('.quiz-container');
        if (!quizContainer) {
            console.error('Quiz container not found');
            return;
        }

        // Load questions
        this.loadQuestions();

        // If no questions found, exit
        if (this.state.questions.length === 0) {
            console.error('No quiz questions found');
            return;
        }

        // Setup event listeners
        this.setupEventListeners();

        // Show first question
        this.showQuestion(0);

        // Update quiz counter display
        this.updateQuizCounter();

        // Mark as initialized
        this.state.isInitialized = true;

        console.log('Quiz System initialized with', this.state.questions.length, 'questions');
    },

    // Load questions from DOM
    loadQuestions() {
        const questionElements = document.querySelectorAll('.quiz-question');

        this.state.questions = Array.from(questionElements).map(element => {
            const options = Array.from(element.querySelectorAll('.quiz-option')).map(option => {
                return {
                    element: option,
                    text: option.querySelector('.option-text') ? .textContent.trim() || '',
                    isCorrect: option.getAttribute('data-correct') === 'true',
                    explanation: option.getAttribute('data-explanation') || ''
                };
            });

            return {
                element: element,
                text: element.querySelector('.question-text') ? .textContent.trim() || '',
                options: options,
                explanation: element.getAttribute('data-explanation') || '',
                selectedOption: null,
                result: null // correct, incorrect, or null
            };
        });

        // Initialize answers array with nulls
        this.state.answers = Array(this.state.questions.length).fill(null);

        // Hide all questions initially
        this.state.questions.forEach(question => {
            question.element.style.display = 'none';
        });
    },

    // Setup event listeners
    setupEventListeners() {
        // Add click handlers to quiz options
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', () => {
                this.handleOptionSelect(option);
            });
        });

        // Add click handlers to navigation buttons
        const prevButton = document.querySelector('.prev-question');
        const nextButton = document.querySelector('.next-question');
        const submitButton = document.querySelector('.submit-quiz');
        const resetButton = document.querySelector('.reset-quiz');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.navigateQuestion(-1);
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.navigateQuestion(1);
            });
        }

        if (submitButton) {
            submitButton.addEventListener('click', () => {
                this.submitQuiz();
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetQuiz();
            });
        }

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing in an input or the quiz is submitted
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || this.state.isSubmitted) {
                return;
            }

            if (e.key === 'ArrowLeft') {
                this.navigateQuestion(-1);
            } else if (e.key === 'ArrowRight') {
                this.navigateQuestion(1);
            }
        });
    },

    // Navigate to previous/next question
    navigateQuestion(direction) {
        const newIndex = this.state.currentIndex + direction;

        if (newIndex >= 0 && newIndex < this.state.questions.length) {
            this.state.currentIndex = newIndex;
            this.showQuestion(newIndex);
            this.updateQuizCounter();
            this.updateNavigationButtons();
        }
    },

    // Show a specific question
    showQuestion(index) {
        // Hide all questions
        this.state.questions.forEach(question => {
            question.element.style.display = 'none';
        });

        // Show the specified question
        if (this.state.questions[index]) {
            this.state.questions[index].element.style.display = 'block';

            // If question was previously answered, show the result
            const previousAnswer = this.state.answers[index];
            if (previousAnswer !== null) {
                this.showAnswerResult(index);
            }
        }

        // Update navigation buttons
        this.updateNavigationButtons();
    },

    // Handle option selection
    handleOptionSelect(option) {
        // If quiz is already submitted, don't allow changes
        if (this.state.isSubmitted) return;

        // Find the question this option belongs to
        const questionElement = option.closest('.quiz-question');
        const questionIndex = this.state.questions.findIndex(q => q.element === questionElement);

        if (questionIndex === -1) return;

        const question = this.state.questions[questionIndex];
        const optionIndex = question.options.findIndex(o => o.element === option);

        if (optionIndex === -1) return;

        // Update selected option
        question.selectedOption = optionIndex;

        // Check if answer is correct
        const isCorrect = question.options[optionIndex].isCorrect;
        question.result = isCorrect ? 'correct' : 'incorrect';

        // Store answer
        this.state.answers[questionIndex] = {
            optionIndex: optionIndex,
            isCorrect: isCorrect
        };

        // Show result
        this.showAnswerResult(questionIndex);

        // Update progress
        this.updateProgress();

        // Auto-advance to next question if enabled
        if (this.config.autoAdvance && questionIndex < this.state.questions.length - 1) {
            setTimeout(() => {
                this.navigateQuestion(1);
            }, this.config.autoProgressDelay);
        }

        // If this was the last question, enable submit button
        if (questionIndex === this.state.questions.length - 1) {
            const submitButton = document.querySelector('.submit-quiz');
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    },

    // Show answer result (correct/incorrect)
    showAnswerResult(questionIndex) {
        const question = this.state.questions[questionIndex];
        if (!question) return;

        const selectedOptionIndex = question.selectedOption;
        if (selectedOptionIndex === null) return;

        // Mark all options as correct/incorrect
        question.options.forEach((option, index) => {
            const element = option.element;

            // Clear previous classes
            element.classList.remove('selected', 'correct', 'wrong');

            // Add appropriate classes
            if (index === selectedOptionIndex) {
                element.classList.add('selected');
                if (option.isCorrect) {
                    element.classList.add('correct');
                } else {
                    element.classList.add('wrong');
                }
            } else if (option.isCorrect) {
                element.classList.add('correct');
            }
        });

        // Show explanation if enabled
        if (this.config.showExplanations) {
            const feedbackElement = question.element.querySelector('.feedback-message');
            if (feedbackElement) {
                const selectedOption = question.options[selectedOptionIndex];
                const isCorrect = selectedOption.isCorrect;

                feedbackElement.textContent = isCorrect ? 'Correct!' : 'Incorrect';
                feedbackElement.className = 'feedback-message visible ' + (isCorrect ? 'correct' : 'incorrect');

                // Add explanation if available
                const explanation = selectedOption.explanation || question.explanation;
                if (explanation) {
                    const explanationElement = document.createElement('div');
                    explanationElement.className = 'explanation';
                    explanationElement.textContent = explanation;

                    // Remove existing explanation if any
                    const existingExplanation = feedbackElement.querySelector('.explanation');
                    if (existingExplanation) {
                        existingExplanation.remove();
                    }

                    feedbackElement.appendChild(explanationElement);
                }
            }
        }
    },

    // Update progress indicator
    updateProgress() {
        const answeredCount = this.state.answers.filter(a => a !== null).length;
        const totalCount = this.state.questions.length;
        const progressPercent = (answeredCount / totalCount) * 100;

        const progressFill = document.querySelector('.quiz-container .progress-fill');
        if (progressFill) {
            progressFill.style.width = progressPercent + '%';
        }
    },

    // Update quiz counter (current question / total questions)
    updateQuizCounter() {
        const currentElement = document.querySelector('.current-question');
        if (currentElement) {
            currentElement.textContent = this.state.currentIndex + 1;
        }

        const totalElement = document.querySelector('.total-questions');
        if (totalElement) {
            totalElement.textContent = this.state.questions.length;
        }
    },

    // Update navigation buttons state
    updateNavigationButtons() {
        const prevButton = document.querySelector('.prev-question');
        const nextButton = document.querySelector('.next-question');
        const submitButton = document.querySelector('.submit-quiz');

        if (prevButton) {
            prevButton.disabled = this.state.currentIndex === 0;
        }

        if (nextButton) {
            nextButton.disabled = this.state.currentIndex === this.state.questions.length - 1;
        }

        if (submitButton) {
            // Enable submit only if all questions are answered
            const allAnswered = this.state.answers.every(a => a !== null);
            submitButton.disabled = !allAnswered;
        }
    },

    // Submit quiz
    submitQuiz() {
        if (this.state.isSubmitted) return;

        // Count correct answers
        const correctCount = this.state.answers.filter(a => a && a.isCorrect).length;
        const totalCount = this.state.questions.length;
        const scorePercent = Math.round((correctCount / totalCount) * 100);

        // Update state
        this.state.isSubmitted = true;

        // Calculate score message
        const passedThreshold = correctCount / totalCount >= this.config.minPassScore;
        const scoreMessage = passedThreshold ?
            'Congratulations! You passed the quiz.' :
            'You didn\'t pass the quiz this time. Try again!';

        // Show quiz results
        const resultsElement = document.querySelector('.quiz-results');
        const scoreElement = document.getElementById('quizScore');
        const feedbackElement = document.querySelector('.quiz-feedback');

        if (resultsElement) {
            resultsElement.style.display = 'block';
        }

        if (scoreElement) {
            scoreElement.textContent = correctCount;
        }

        if (feedbackElement) {
            feedbackElement.innerHTML = `
                <p>${scoreMessage}</p>
                <p>Your score: ${scorePercent}%</p>
            `;
        }

        // Hide questions and show results
        this.state.questions.forEach(question => {
            question.element.style.display = 'none';
        });

        // Hide navigation and submit buttons
        const navigationButtons = document.querySelector('.quiz-controls');
        if (navigationButtons) {
            navigationButtons.style.display = 'none';
        }

        // Mark section as complete if passed
        if (passedThreshold) {
            const completeButton = document.querySelector('.section[data-section="quiz"] .section-complete-btn');
            if (completeButton) {
                completeButton.click();
            }
        }
    },

    // Reset quiz
    resetQuiz() {
        // Reset state
        this.state.currentIndex = 0;
        this.state.isSubmitted = false;
        this.state.answers = Array(this.state.questions.length).fill(null);

        // Reset UI
        this.state.questions.forEach(question => {
            // Reset question result
            question.selectedOption = null;
            question.result = null;

            // Reset option styling
            question.options.forEach(option => {
                option.element.classList.remove('selected', 'correct', 'wrong');
            });

            // Clear feedback
            const feedbackElement = question.element.querySelector('.feedback-message');
            if (feedbackElement) {
                feedbackElement.className = 'feedback-message';
                feedbackElement.textContent = '';
            }
        });

        // Reset progress
        this.updateProgress();

        // Show first question
        this.showQuestion(0);

        // Update counter
        this.updateQuizCounter();

        // Hide results
        const resultsElement = document.querySelector('.quiz-results');
        if (resultsElement) {
            resultsElement.style.display = 'none';
        }

        // Show navigation buttons
        const navigationButtons = document.querySelector('.quiz-controls');
        if (navigationButtons) {
            navigationButtons.style.display = 'flex';
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    QuizSystem.init();
});
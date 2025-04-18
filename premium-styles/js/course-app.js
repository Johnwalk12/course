/**
 * Fluent Speaker Course Platform - Core Application
 * 
 * This script handles:
 * - Section navigation
 * - Progress tracking
 * - Interactive elements
 * - Audio and text-to-speech
 * 
 * v1.0.0
 */

// Main Application Object
const FluentSpeakerCourse = {
    // Configuration
    config: {
        sectionIds: ['objectives', 'video', 'vocabulary', 'phrases', 'practice', 'quiz', 'book-trial'],
        progressKey: 'fluent_speaker_progress',
        animationDuration: 400
    },

    // State variables
    state: {
        currentSectionIndex: 0,
        progress: {
            completedSections: [],
            lastVisited: null
        },
        audioController: null
    },

    // Initialize application
    init() {
        console.log('Initializing Fluent Speaker Course Platform...');

        // Load progress from localStorage
        this.loadProgress();

        // Initialize section navigation
        this.initNavigation();

        // Initialize completion tracking
        this.initCompletionButtons();

        // Initialize interactive elements
        this.initVocabularyPractice();
        this.initTextToSpeech();

        // Update UI to match current state
        this.updateUI();

        console.log('Fluent Speaker Course Platform initialized');
    },

    // Load saved progress
    loadProgress() {
        try {
            const savedProgress = localStorage.getItem(this.config.progressKey);
            if (savedProgress) {
                const parsedProgress = JSON.parse(savedProgress);
                this.state.progress = {
                    ...this.state.progress,
                    ...parsedProgress
                };

                // Set current section to last visited if available
                if (typeof parsedProgress.currentSectionIndex === 'number') {
                    this.state.currentSectionIndex = parsedProgress.currentSectionIndex;
                }
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    },

    // Save progress to localStorage
    saveProgress() {
        try {
            const progressData = {
                ...this.state.progress,
                currentSectionIndex: this.state.currentSectionIndex,
                lastVisited: new Date().toISOString()
            };

            localStorage.setItem(this.config.progressKey, JSON.stringify(progressData));
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    },

    // Initialize navigation
    initNavigation() {
        // Section navigation links
        document.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                if (sectionId) {
                    this.navigateToSection(sectionId);
                }
            });
        });

        // Next/Previous buttons
        const prevButton = document.getElementById('prev-section');
        const nextButton = document.getElementById('next-section');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.navigateToPrevious();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.navigateToNext();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Don't navigate if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'ArrowLeft') {
                this.navigateToPrevious();
            } else if (e.key === 'ArrowRight') {
                this.navigateToNext();
            }
        });

        // Initial section activation
        this.activateCurrentSection();
    },

    // Navigate to previous section
    navigateToPrevious() {
        if (this.state.currentSectionIndex > 0) {
            this.state.currentSectionIndex--;
            this.activateCurrentSection();
        }
    },

    // Navigate to next section
    navigateToNext() {
        if (this.state.currentSectionIndex < this.config.sectionIds.length - 1) {
            this.state.currentSectionIndex++;
            this.activateCurrentSection();
        }
    },

    // Navigate to specific section
    navigateToSection(sectionId) {
        const index = this.config.sectionIds.indexOf(sectionId);
        if (index !== -1) {
            this.state.currentSectionIndex = index;
            this.activateCurrentSection();
        }
    },

    // Activate current section
    activateCurrentSection() {
        const sectionId = this.config.sectionIds[this.state.currentSectionIndex];

        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show current section
        const currentSection = document.getElementById(sectionId);
        if (currentSection) {
            currentSection.classList.add('active');

            // Smooth scroll to section top
            currentSection.scrollIntoView({ behavior: 'smooth' });

            // Log section view for analytics
            console.log('Section viewed:', sectionId);
        }

        // Update navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });

        // Update navigation buttons
        this.updateNavigationButtons();

        // Save progress
        this.saveProgress();
    },

    // Update navigation buttons state
    updateNavigationButtons() {
        const prevButton = document.getElementById('prev-section');
        const nextButton = document.getElementById('next-section');

        if (prevButton) {
            prevButton.disabled = this.state.currentSectionIndex === 0;
        }

        if (nextButton) {
            nextButton.disabled = this.state.currentSectionIndex === this.config.sectionIds.length - 1;
        }
    },

    // Initialize section completion buttons
    initCompletionButtons() {
        document.querySelectorAll('.section-complete-btn').forEach(button => {
            const sectionId = button.getAttribute('data-section');

            // Set initial button state
            if (this.state.progress.completedSections &&
                this.state.progress.completedSections.includes(sectionId)) {
                button.classList.add('completed');
                button.textContent = 'Completed';
                this.updateSectionProgress(sectionId, 100);
            }

            // Add click handler
            button.addEventListener('click', () => {
                if (!this.state.progress.completedSections) {
                    this.state.progress.completedSections = [];
                }

                if (!this.state.progress.completedSections.includes(sectionId)) {
                    this.state.progress.completedSections.push(sectionId);
                    button.classList.add('completed');
                    button.textContent = 'Completed';

                    // Update progress indicators
                    this.updateSectionProgress(sectionId, 100);
                    this.updateOverallProgress();

                    // Save progress
                    this.saveProgress();

                    // Auto-advance to next section after a delay
                    const sectionIndex = this.config.sectionIds.indexOf(sectionId);
                    if (sectionIndex < this.config.sectionIds.length - 1) {
                        setTimeout(() => {
                            this.navigateToNext();
                        }, 1000);
                    } else if (sectionIndex === this.config.sectionIds.length - 1) {
                        // Show completion message if this was the last section
                        const completionMessage = document.getElementById('completion');
                        if (completionMessage) {
                            completionMessage.style.display = 'block';
                        }
                    }
                }
            });
        });
    },

    // Update section progress indicator
    updateSectionProgress(sectionId, percent) {
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-section') === sectionId) {
                const progressFill = link.querySelector('.progress-fill');
                if (progressFill) {
                    progressFill.style.width = `${percent}%`;
                }
            }
        });
    },

    // Update overall progress bar
    updateOverallProgress() {
        if (!this.state.progress.completedSections) return;

        const percentComplete = (this.state.progress.completedSections.length / this.config.sectionIds.length) * 100;
        const progressBar = document.getElementById('progressFill');

        if (progressBar) {
            progressBar.style.width = `${percentComplete}%`;
        }
    },

    // Initialize vocabulary practice
    initVocabularyPractice() {
        // Fill-in-the-blank vocabulary practice
        const checkAnswersBtn = document.querySelector('.check-answers-btn');
        if (checkAnswersBtn) {
            checkAnswersBtn.addEventListener('click', () => {
                let allCorrect = true;

                document.querySelectorAll('.vocabulary-input').forEach(input => {
                    const correctAnswer = input.getAttribute('data-answer');
                    if (!correctAnswer) return;

                    const userAnswer = input.value.trim().toLowerCase();
                    const isCorrect = userAnswer === correctAnswer.toLowerCase();

                    // Update styling based on answer
                    input.style.backgroundColor = isCorrect ?
                        'rgba(76, 175, 80, 0.2)' : 'rgba(255, 82, 82, 0.2)';
                    input.style.borderColor = isCorrect ? '#4CAF50' : '#FF5252';

                    // If incorrect, show correct answer
                    if (!isCorrect) {
                        allCorrect = false;
                        // Fixed optional chaining with standard conditional
                        const practiceItem = input.closest('.practice-item');
                        const feedbackElement = practiceItem ? practiceItem.querySelector('.practice-feedback') : null;
                        if (feedbackElement) {
                            feedbackElement.textContent = `Correct answer: ${correctAnswer}`;
                            feedbackElement.style.color = '#4CAF50';
                        }
                    }
                });

                // Show overall feedback
                if (allCorrect) {
                    this.showMessage('Great job! All answers are correct.', 'success');
                }
            });
        }
    },

    // Initialize text-to-speech functionality
    initTextToSpeech() {
        // Only initialize if Speech Synthesis is available
        if (!window.speechSynthesis) {
            console.log('Speech synthesis not supported in this browser');
            return;
        }

        // Initialize speech synthesis
        this.state.audioController = {
            speaking: false,
            voice: null,
            currentButton: null
        };

        // Load voices when available
        const loadVoices = () => {
            const voices = speechSynthesis.getVoices();

            // Prefer female English voice
            this.state.audioController.voice = voices.find(voice =>
                voice.lang.includes('en') &&
                voice.name.toLowerCase().includes('female')
            ) || voices.find(voice =>
                voice.lang.includes('en')
            ) || voices[0];
        };

        // Load voices immediately or wait for voices to be loaded
        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Add click handlers to vocabulary audio buttons
        document.querySelectorAll('.vocab-audio').forEach(button => {
            button.addEventListener('click', () => {
                const card = button.closest('.vocab-card');
                if (!card) return;

                const word = card.querySelector('.vocab-word').textContent.trim();
                this.speakText(word, button);
            });
        });

        // Add click handlers to phrase audio buttons
        document.querySelectorAll('.phrase-audio').forEach(button => {
            button.addEventListener('click', () => {
                const phraseItem = button.closest('.phrase-item');
                if (!phraseItem) return;

                const phrase = phraseItem.querySelector('.phrase').textContent.trim();
                this.speakText(phrase, button);
            });
        });

        // Add click handlers to example audio buttons
        document.querySelectorAll('.example-audio').forEach(button => {
            button.addEventListener('click', () => {
                const exampleContainer = button.closest('.example-container');
                const example = exampleContainer ? exampleContainer.querySelector('.example') : null;
                const exampleText = example ? example.textContent.trim() : '';

                if (exampleText) {
                    this.speakText(exampleText, button);
                }
            });
        });

        console.log('Audio Controller initialized');
    },

    // Speak text using speech synthesis
    speakText(text, button) {
        if (!window.speechSynthesis || !this.state.audioController.voice) return;

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        // Reset previous button if different
        if (this.state.audioController.currentButton &&
            this.state.audioController.currentButton !== button) {
            const icon = this.state.audioController.currentButton.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-volume-up';
            }
            this.state.audioController.currentButton.classList.remove('playing');
        }

        // If already speaking the same text, just stop
        if (this.state.audioController.speaking &&
            this.state.audioController.currentButton === button) {
            this.state.audioController.speaking = false;
            button.classList.remove('playing');
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-volume-up';
            }
            return;
        }

        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.state.audioController.voice;
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.1; // Slightly higher for clarity

        // Update UI when speaking starts
        utterance.onstart = () => {
            this.state.audioController.speaking = true;
            this.state.audioController.currentButton = button;

            button.classList.add('playing');
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-pause';
            }
        };

        // Update UI when speaking ends
        utterance.onend = () => {
            this.state.audioController.speaking = false;

            button.classList.remove('playing');
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-volume-up';
            }
        };

        // Speak the text
        speechSynthesis.speak(utterance);
    },

    // Show message to user
    showMessage(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 
                               type === 'warning' ? 'fa-exclamation-triangle' : 
                               type === 'success' ? 'fa-check-circle' :
                               'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="close-message"><i class="fas fa-times"></i></button>
        `;

        document.body.appendChild(messageElement);

        // Add close button functionality
        const closeBtn = messageElement.querySelector('.close-message');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(messageElement);
            });
        }

        // Auto-remove after a delay
        setTimeout(() => {
            if (document.body.contains(messageElement)) {
                messageElement.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(messageElement)) {
                        document.body.removeChild(messageElement);
                    }
                }, 500);
            }
        }, 5000);
    },

    // Update UI to match current state
    updateUI() {
        // Update navigation buttons
        this.updateNavigationButtons();

        // Update progress indicators
        this.updateOverallProgress();

        if (this.state.progress.completedSections) {
            this.state.progress.completedSections.forEach(sectionId => {
                this.updateSectionProgress(sectionId, 100);
            });
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    FluentSpeakerCourse.init();
});
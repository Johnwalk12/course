/**
 * Fluent Speaker Course Platform - Voice Recorder Component
 * 
 * This script provides voice recording functionality:
 * - Voice recording with transcription
 * - Audio playback
 * - Word counting
 * - Cross-browser compatibility
 * 
 * v1.0.0
 */

// Voice Recorder Object
const VoiceRecorder = {
    // Configuration
    config: {
        audioFormat: 'audio/webm',
        fallbackFormat: 'audio/mp4',
        maxRecordingTime: 60000, // 1 minute
        recordingStatusUpdateInterval: 1000,
        autoStopRecording: true
    },

    // State variables
    state: {
        isInitialized: false,
        activeRecorders: [],
        stream: null,
        recognizer: null
    },

    // Initialize recorder
    init() {
        console.log('Initializing Voice Recorder...');

        // Avoid double initialization
        if (this.state.isInitialized) return;

        // Initialize all record buttons
        const recordButtons = document.querySelectorAll('.record-response');
        if (recordButtons.length === 0) {
            console.log('No recording buttons found');
            return;
        }

        // Add event listeners to all record buttons
        recordButtons.forEach(button => {
            // Create recorder state for this button
            const responseArea = button.closest('.response-area');
            if (!responseArea) return;

            const recorder = {
                button: button,
                responseArea: responseArea,
                textArea: responseArea.querySelector('textarea'),
                transcriptionElement: responseArea.querySelector('.transcription-text'),
                wordCountElement: responseArea.querySelector('.word-count'),
                saveButton: responseArea.querySelector('.save-response'),
                mediaRecorder: null,
                isRecording: false,
                audioChunks: [],
                audioBlob: null,
                audioUrl: null
            };

            // Add recorder to active recorders
            this.state.activeRecorders.push(recorder);

            // Add click event listener
            button.addEventListener('click', () => {
                this.handleRecordButtonClick(button);
            });

            // Add save button event listener
            if (recorder.saveButton) {
                recorder.saveButton.addEventListener('click', () => {
                    this.handleSaveButtonClick(recorder.saveButton);
                });
            }

            // Add word count listener if text area exists
            if (recorder.textArea) {
                recorder.textArea.addEventListener('input', () => {
                    this.updateWordCount(recorder);
                });

                // Initial word count
                this.updateWordCount(recorder);
            }
        });

        // Try to initialize speech recognition
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.state.recognizer = new SpeechRecognition();
                this.state.recognizer.continuous = true;
                this.state.recognizer.interimResults = true;
                this.state.recognizer.lang = 'en-US';
                this.setupRecognizerHandlers();
            } else {
                console.log('Speech recognition not supported in this browser');
            }
        } catch (error) {
            console.log('Speech recognition not supported:', error);
        }

        // Mark as initialized
        this.state.isInitialized = true;

        console.log('Voice recorder initialized');
    },

    // Set up speech recognition handlers
    setupRecognizerHandlers() {
        if (!this.state.recognizer) return;

        // On result handler
        this.state.recognizer.onresult = (event) => {
            // Find active recorder
            const activeRecorder = this.state.activeRecorders.find(r => r.isRecording);
            if (!activeRecorder || !activeRecorder.transcriptionElement) return;

            let interimTranscript = '';
            let finalTranscript = '';

            // Process results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update transcription
            if (finalTranscript) {
                // If final, update text area with final transcript
                if (activeRecorder.textArea) {
                    activeRecorder.textArea.value += finalTranscript;
                    this.updateWordCount(activeRecorder);
                }
            }

            // Always update the transcription display with interim results
            activeRecorder.transcriptionElement.textContent = interimTranscript;
        };

        // Error handler
        this.state.recognizer.onerror = (event) => {
            console.error('Speech recognition error:', event.error);

            if (event.error === 'not-allowed') {
                this.showGlobalMessage('Microphone access denied. Please allow microphone access to use voice recording.', 'error');
            } else if (event.error === 'network') {
                this.showGlobalMessage('Network error occurred during speech recognition.', 'warning');
            }
        };

        // End handler
        this.state.recognizer.onend = () => {
            // Find active recorder
            const activeRecorder = this.state.activeRecorders.find(r => r.isRecording);
            if (!activeRecorder) return;

            // Don't restart recognition if we're no longer recording
            if (!activeRecorder.isRecording) return;

            // Restart recognition (to keep it continuous)
            try {
                this.state.recognizer.start();
            } catch (e) {
                // Ignore errors when restarting
            }
        };
    },

    // Handle record button click
    async handleRecordButtonClick(button) {
        // Find recorder for this button
        const recorder = this.state.activeRecorders.find(r => r.button === button);
        if (!recorder) return;

        // Toggle recording state
        if (recorder.isRecording) {
            await this.stopRecording(recorder);
        } else {
            await this.startRecording(recorder);
        }
    },

    // Start recording
    async startRecording(recorder) {
        // Stop any other active recordings
        for (const r of this.state.activeRecorders) {
            if (r.isRecording) {
                await this.stopRecording(r);
            }
        }

        try {
            // Request microphone access
            if (!this.state.stream) {
                this.state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            // Create media recorder
            const mimeType = this.getSupportedMimeType();
            recorder.mediaRecorder = new MediaRecorder(this.state.stream, { mimeType });

            // Set up event handlers
            recorder.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recorder.audioChunks.push(event.data);
                }
            };

            recorder.mediaRecorder.onstop = () => {
                this.finalizeRecording(recorder);
            };

            // Reset audio chunks
            recorder.audioChunks = [];

            // Start recording
            recorder.mediaRecorder.start();
            recorder.isRecording = true;

            // Update UI
            this.updateRecordButtonState(recorder, true);
            this.showStatus('Recording...', recorder.responseArea);

            // Log recording start
            console.log('Recording started');

            // Start speech recognition if available
            if (this.state.recognizer) {
                try {
                    this.state.recognizer.start();
                } catch (e) {
                    // Ignore errors when starting (might already be running)
                }
            }

            // Auto-stop recording after max time if enabled
            if (this.config.autoStopRecording) {
                setTimeout(() => {
                    if (recorder.isRecording) {
                        this.stopRecording(recorder);
                    }
                }, this.config.maxRecordingTime);
            }
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showGlobalMessage('Could not access microphone. Please check your browser settings.', 'error');
        }
    },

    // Stop recording
    async stopRecording(recorder) {
        if (!recorder.isRecording || !recorder.mediaRecorder) return;

        try {
            // Stop recording
            recorder.mediaRecorder.stop();
            recorder.isRecording = false;

            // Update UI
            this.updateRecordButtonState(recorder, false);
            this.showStatus('Processing recording...', recorder.responseArea);

            // Log recording stop
            console.log('Recording stopped');

            // Stop speech recognition
            if (this.state.recognizer) {
                try {
                    this.state.recognizer.stop();
                } catch (e) {
                    // Ignore errors when stopping
                }
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
            this.showGlobalMessage('Error stopping recording.', 'error');
        }
    },

    // Finalize recording
    finalizeRecording(recorder) {
        // Create audio blob
        const mimeType = this.getSupportedMimeType();
        recorder.audioBlob = new Blob(recorder.audioChunks, { type: mimeType });

        // Create URL for audio
        if (recorder.audioUrl) {
            URL.revokeObjectURL(recorder.audioUrl);
        }
        recorder.audioUrl = URL.createObjectURL(recorder.audioBlob);

        // Create audio player
        this.createAudioPlayer(recorder);

        // Show message
        this.showStatus('Recording complete', recorder.responseArea);

        // Enable save button
        if (recorder.saveButton) {
            recorder.saveButton.classList.add('active');
        }
    },

    // Create audio player
    createAudioPlayer(recorder) {
        if (!recorder.audioUrl) return;

        // Find or create audio player container
        let playerContainer = recorder.responseArea.querySelector('.audio-player');
        if (!playerContainer) {
            playerContainer = document.createElement('div');
            playerContainer.className = 'audio-player';
            recorder.responseArea.appendChild(playerContainer);
        }

        // Clear previous content
        playerContainer.innerHTML = '';

        // Create audio element
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = recorder.audioUrl;
        playerContainer.appendChild(audio);

        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-recording-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Recording';
        downloadBtn.addEventListener('click', () => {
            this.downloadRecording(recorder);
        });
        playerContainer.appendChild(downloadBtn);
    },

    // Handle save button click
    handleSaveButtonClick(saveButton) {
        // Find recorder for this button
        const responseArea = saveButton.closest('.response-area');
        const recorder = this.state.activeRecorders.find(r => r.responseArea === responseArea);
        if (!recorder || !recorder.audioUrl) return;

        // Save recording
        this.downloadRecording(recorder);
    },

    // Download recording
    downloadRecording(recorder) {
        if (!recorder.audioBlob) return;

        // Create filename based on timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording-${timestamp}.webm`;

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = recorder.audioUrl;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);

        // Trigger download
        downloadLink.click();

        // Clean up
        document.body.removeChild(downloadLink);

        // Show message
        this.showGlobalMessage('Recording saved to your downloads folder.', 'success');
    },

    // Update record button state
    updateRecordButtonState(recorder, isRecording) {
        if (isRecording) {
            recorder.button.classList.add('recording');
            recorder.button.querySelector('i').className = 'fas fa-stop';
        } else {
            recorder.button.classList.remove('recording');
            recorder.button.querySelector('i').className = 'fas fa-microphone';
        }
    },

    // Update word count
    updateWordCount(recorder) {
        if (!recorder.textArea || !recorder.wordCountElement) return;

        const text = recorder.textArea.value.trim();
        const wordCount = text ? text.split(/\s+/).length : 0;

        recorder.wordCountElement.textContent = `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`;
    },

    // Show status message in response area
    showStatus(message, responseArea) {
        // Find or create status element
        let statusElement = responseArea.querySelector('.recording-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'recording-status';
            responseArea.appendChild(statusElement);
        }

        // Update message
        statusElement.textContent = message;

        // Auto-hide after a delay
        setTimeout(() => {
            statusElement.style.opacity = '0';
            setTimeout(() => {
                if (responseArea.contains(statusElement)) {
                    responseArea.removeChild(statusElement);
                }
            }, 500);
        }, 2000);
    },

    // Show global message
    showGlobalMessage(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `global-message ${type}`;

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

    // Get supported MIME type for audio recording
    getSupportedMimeType() {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
            return 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            return 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            return 'audio/ogg';
        }

        // Default to webm and hope for the best
        return 'audio/webm';
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    VoiceRecorder.init();
});
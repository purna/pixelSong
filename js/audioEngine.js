// audioEngine.js - Audio context management and playback

class AudioEngine {
    constructor() {
        this.context = null;
        this.sampleRate = 44100;
        this.currentSource = null;
        this.initialized = false;
    }

    async initAudioContext() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('AudioContext initialized after user gesture');
        }
        return this.context;
    }

    async ensureContextResumed() {
        if (!this.context) {
            await this.initAudioContext();
        }
        if (this.context.state === 'suspended') {
            try {
                await this.context.resume();
                console.log('AudioContext resumed');
            } catch (e) {
                console.error('Failed to resume AudioContext:', e);
            }
        }
    }

    setSampleRate(rate) {
        this.sampleRate = rate;
    }

    async playBuffer(buffer, onEnded = null) {
        console.log('AudioEngine.playBuffer called');
        console.log('Context state before:', this.context.state);
        
        // Ensure context is resumed before playing - wait longer for browser policies
        await this.ensureContextResumed();
        
        // Add additional delay for browser audio policies
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Context state after resume:', this.context.state);

        // Stop any currently playing sound
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Source might have already stopped
                console.log('Previous source already stopped');
            }
        }

        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        
        console.log('Starting playback...');
        source.start();
        
        this.currentSource = source;
        
        // Clear reference when done
        source.onended = () => {
            console.log('Playback ended');
            if (this.currentSource === source) {
                this.currentSource = null;
            }
            // Call onEnded callback if provided
            if (onEnded) {
                onEnded();
            }
        };

        return source;
    }

    playBufferAtTime(buffer, startTime, onEnded) {
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.start(this.context.currentTime + startTime);
        
        if (onEnded) {
            source.onended = onEnded;
        }
        
        return source;
    }

    stopAll() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentSource = null;
        }
    }

    createBuffer(samples, sampleRate = null) {
        const rate = sampleRate || this.sampleRate;
        return this.context.createBuffer(1, samples, this.context.sampleRate);
    }

    applyLowPassFilter(data, cutoff, sampleRate) {
        const RC = 1.0 / (cutoff * 2 * Math.PI);
        const dt = 1.0 / sampleRate;
        const alpha = dt / (RC + dt);
        
        for (let i = 1; i < data.length; i++) {
            data[i] = data[i - 1] + alpha * (data[i] - data[i - 1]);
        }
    }

    applyHighPassFilter(data, cutoff, sampleRate) {
        const RC = 1.0 / (cutoff * 2 * Math.PI);
        const dt = 1.0 / sampleRate;
        const alpha = RC / (RC + dt);
        
        let y = 0;
        for (let i = 1; i < data.length; i++) {
            y = alpha * (y + data[i] - data[i - 1]);
            data[i] = y;
        }
    }

    downloadWAV(buffer, filename = 'sound.wav') {
        try {
            console.log('Downloading WAV file:', filename);
            const wav = this.bufferToWave(buffer, buffer.length);
            const blob = new Blob([wav], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            
            // Create temporary download link
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            
            // Add to DOM, trigger download, then remove
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log('WAV file download initiated:', filename);
        } catch (error) {
            console.error('Error downloading WAV:', error);
        }
    }

    bufferToWave(buffer, len) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const data = new Int16Array(len * numChannels);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < len; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        const dataLength = data.length * bytesPerSample;
        const arrayBuffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(arrayBuffer);

        // RIFF chunk descriptor
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        this.writeString(view, 8, 'WAVE');

        // FMT sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);

        // Data sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        // Write audio data
        let offset = 44;
        for (let i = 0; i < data.length; i++) {
            view.setInt16(offset, data[i], true);
            offset += 2;
        }

        return arrayBuffer;
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    mixBuffers(buffers, volumes = null, offsets = []) {
        if (buffers.length === 0) return null;
    
        // Compute max length with offsets
        let maxLength = 0;
        buffers.forEach((buf, idx) => {
            const off = offsets[idx] || 0;
            if (buf.length + off > maxLength) {
                maxLength = buf.length + off;
            }
        });
    
        const mixedBuffer = this.context.createBuffer(1, maxLength, this.context.sampleRate);
        const output = mixedBuffer.getChannelData(0);
    
        // Mix with offsets
        buffers.forEach((buffer, idx) => {
            const data = buffer.getChannelData(0);
            const volume = volumes ? volumes[idx] : 1;
            const off = offsets[idx] || 0;
    
            for (let i = 0; i < data.length; i++) {
                if (i + off < output.length) {
                    output[i + off] += data[i] * volume;
                }
            }
        });
    
        // Normalize
        let max = 0;
        for (let i = 0; i < output.length; i++) {
            if (Math.abs(output[i]) > max) max = Math.abs(output[i]);
        }
        if (max > 1) {
            for (let i = 0; i < output.length; i++) output[i] /= max;
        }
    
        return mixedBuffer;
    }
}
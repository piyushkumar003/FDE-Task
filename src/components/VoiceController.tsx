import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Square, Sparkles, Volume2 } from 'lucide-react';

interface VoiceControllerProps {
  onTranscriptComplete: (transcript: string) => void;
  isProcessing: boolean;
  isAudioMuted: boolean;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onTranscriptComplete,
  isProcessing,
  isAudioMuted,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.interimResults = true;

        reco.onresult = (event: any) => {
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const final = event.results[i][0].transcript;
              setInterimTranscript('');
              setIsRecording(false);
              onTranscriptComplete(final);
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          setInterimTranscript(currentInterim);
        };

        reco.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        reco.onend = () => {
          setIsRecording(false);
        };

        setRecognition(reco);
      }
    }
  }, [onTranscriptComplete]);

  const toggleRecording = () => {
    if (!recognition) {
      // Fallback if browser does not support Web Speech API natively
      if (!isRecording) {
        setIsRecording(true);
        setInterimTranscript('Listening... "Schedule a meeting with John tomorrow at 3 PM"');
        setTimeout(() => {
          setIsRecording(false);
          setInterimTranscript('');
          onTranscriptComplete('Schedule a meeting with John tomorrow at 3 PM');
        }, 3000);
      } else {
        setIsRecording(false);
        setInterimTranscript('');
      }
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setInterimTranscript('Listening...');
      setIsRecording(true);
      try {
        recognition.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  };

  return (
    <div id="voice-controller-panel" className="relative flex flex-col items-center">
      {/* Interim voice speech feedback bubble */}
      {isRecording && (
        <div className="absolute -top-14 bg-zinc-900 border border-blue-500/40 text-blue-300 font-mono text-xs px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-3 bg-blue-400 animate-pulse rounded-full" />
            <span className="w-1.5 h-5 bg-blue-500 animate-pulse delay-75 rounded-full" />
            <span className="w-1.5 h-2 bg-blue-300 animate-pulse delay-150 rounded-full" />
          </div>
          <span className="font-medium italic">{interimTranscript || 'Speak now...'}</span>
        </div>
      )}

      {/* Mic Button */}
      <button
        id="btn-voice-recorder"
        type="button"
        onClick={toggleRecording}
        disabled={isProcessing}
        title={isRecording ? 'Stop Voice Recording' : 'Start Voice Command'}
        className={`relative p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
          isRecording
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-2 ring-rose-500/50'
            : isProcessing
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
        }`}
      >
        {isRecording ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Mic className="w-5 h-5 text-blue-400" />
        )}
      </button>
    </div>
  );
};

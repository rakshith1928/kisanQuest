import { Request, Response } from 'express';
// We would ideally import Google Cloud client libraries here.
// import { SpeechClient } from '@google-cloud/speech';
// import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// const speechClient = new SpeechClient();
// const ttsClient = new TextToSpeechClient();

export const processSTT = async (req: Request, res: Response) => {
  try {
    const { audio, languageCode } = req.body;

    if (!audio || !languageCode) {
      return res.status(400).json({ error: 'Audio data and language code are required' });
    }

    // Proxy request to Google Cloud STT
    // const request = {
    //   audio: { content: audio },
    //   config: {
    //     encoding: 'LINEAR16',
    //     sampleRateHertz: 16000,
    //     languageCode: languageCode,
    //   },
    // };
    // const [response] = await speechClient.recognize(request);
    // const transcription = response.results
    //   ?.map(result => result.alternatives?.[0]?.transcript)
    //   .join('\n');

    // For now, mock the response until GCP keys are provided
    const mockTranscription = 'बीमा (mocked stt)';

    res.status(200).json({ transcript: mockTranscription });
  } catch (error) {
    console.error('STT error:', error);
    res.status(500).json({ error: 'Server error processing speech to text' });
  }
};

export const processTTS = async (req: Request, res: Response) => {
  try {
    const { text, languageCode } = req.body;

    if (!text || !languageCode) {
      return res.status(400).json({ error: 'Text and language code are required' });
    }

    // Proxy request to Google Cloud TTS
    // const request = {
    //   input: { text: text },
    //   voice: { languageCode: languageCode, name: `${languageCode}-Standard-A` },
    //   audioConfig: { audioEncoding: 'MP3' },
    // };
    // const [response] = await ttsClient.synthesizeSpeech(request);
    // const audioContent = response.audioContent;

    // Mock response
    res.status(200).json({ audioContent: 'mocked_base64_audio_data' });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Server error processing text to speech' });
  }
};

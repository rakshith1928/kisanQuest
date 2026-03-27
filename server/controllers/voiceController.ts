import { Request, Response } from 'express';

const HF_STT_ENDPOINT = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3';
const HF_TTS_MODELS: Record<string, string> = {
  hi: 'facebook/mms-tts-hin',
  en: 'facebook/mms-tts-eng',
  mr: 'facebook/mms-tts-mar',
  ta: 'facebook/mms-tts-tam',
  te: 'facebook/mms-tts-tel',
  kn: 'facebook/mms-tts-kan',
};

export const processSTT = async (req: Request, res: Response) => {
  try {
    const { audio, languageCode } = req.body; // audio expected as base64 string

    if (!audio || !languageCode) {
      return res.status(400).json({ error: 'Audio data and language code are required' });
    }

    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY) {
      // Fallback
      return res.status(200).json({ transcript: 'Hello from fallback STT' });
    }

    const buffer = Buffer.from(audio, 'base64');

    const hfRes = await fetch(HF_STT_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'audio/wav',
        },
        body: buffer,
    });

    const data = await hfRes.json();
    const transcript = data?.text || 'Could not transcribe';

    res.status(200).json({ transcript });
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

    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY) {
      return res.status(200).json({ audioContent: 'mocked_base64_audio_data' });
    }

    const model = HF_TTS_MODELS[languageCode] || HF_TTS_MODELS['hi'];
    const endpoint = `https://api-inference.huggingface.co/models/${model}`;

    const hfRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
    });

    const arrayBuffer = await hfRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    res.status(200).json({ audioContent: base64 });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Server error processing text to speech' });
  }
};

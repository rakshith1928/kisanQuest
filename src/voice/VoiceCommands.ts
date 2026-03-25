/**
 * VoiceCommands.ts
 * Maps spoken keywords (across languages) to game action constants.
 */

export type GameAction =
    | 'CHOOSE_INSURANCE'
    | 'TAKE_LOAN'
    | 'SAVE_MONEY'
    | 'SELL_CROP'
    | 'INVEST'
    | 'GO_TO_MARKET'
    | 'DIGITAL_PAYMENT'
    | 'CONFIRM'
    | 'CANCEL'
    | 'NEXT'
    | 'BACK'
    | 'HELP'
    | 'SELECT_HINDI'
    | 'SELECT_ENGLISH'
    | 'SELECT_MARATHI';

export type SupportedLanguage = 'hi' | 'en' | 'mr' | 'ta' | 'te' | 'kn';

type CommandMap = Record<SupportedLanguage, Record<string, GameAction>>;

const COMMAND_MAP: CommandMap = {
    hi: {
        'बीमा': 'CHOOSE_INSURANCE',
        'इंश्योरेंस': 'CHOOSE_INSURANCE',
        'कर्ज़': 'TAKE_LOAN',
        'ऋण': 'TAKE_LOAN',
        'बचत': 'SAVE_MONEY',
        'बचाओ': 'SAVE_MONEY',
        'बेचो': 'SELL_CROP',
        'बेचना': 'SELL_CROP',
        'निवेश': 'INVEST',
        'मंडी': 'GO_TO_MARKET',
        'डिजिटल': 'DIGITAL_PAYMENT',
        'यूपीआई': 'DIGITAL_PAYMENT',
        'हाँ': 'CONFIRM',
        'नहीं': 'CANCEL',
        'अगला': 'NEXT',
        'वापस': 'BACK',
        'मदद': 'HELP',
        'हिंदी': 'SELECT_HINDI',
        'hindi': 'SELECT_HINDI',
        'english': 'SELECT_ENGLISH',
        'अंग्रेजी': 'SELECT_ENGLISH',
        'marathi': 'SELECT_MARATHI',
        'मराठी': 'SELECT_MARATHI',
    },
    en: {
        'insurance': 'CHOOSE_INSURANCE',
        'insure': 'CHOOSE_INSURANCE',
        'loan': 'TAKE_LOAN',
        'borrow': 'TAKE_LOAN',
        'save': 'SAVE_MONEY',
        'savings': 'SAVE_MONEY',
        'sell': 'SELL_CROP',
        'invest': 'INVEST',
        'market': 'GO_TO_MARKET',
        'mandi': 'GO_TO_MARKET',
        'digital': 'DIGITAL_PAYMENT',
        'upi': 'DIGITAL_PAYMENT',
        'yes': 'CONFIRM',
        'no': 'CANCEL',
        'next': 'NEXT',
        'back': 'BACK',
        'help': 'HELP',
        'hindi': 'SELECT_HINDI',
        'english': 'SELECT_ENGLISH',
        'marathi': 'SELECT_MARATHI',
    },
    mr: {
        'विमा': 'CHOOSE_INSURANCE',
        'कर्ज': 'TAKE_LOAN',
        'बचत': 'SAVE_MONEY',
        'विक्री': 'SELL_CROP',
        'बाजार': 'GO_TO_MARKET',
        'होय': 'CONFIRM',
        'नाही': 'CANCEL',
        'पुढे': 'NEXT',
        'मदत': 'HELP',
        'हिंदी': 'SELECT_HINDI',
        'इंग्रजी': 'SELECT_ENGLISH',
        'मराठी': 'SELECT_MARATHI',
    },
    ta: {
        'காப்பீடு': 'CHOOSE_INSURANCE',
        'கடன்': 'TAKE_LOAN',
        'சேமிப்பு': 'SAVE_MONEY',
        'விற்க': 'SELL_CROP',
        'சந்தை': 'GO_TO_MARKET',
        'ஆம்': 'CONFIRM',
        'இல்லை': 'CANCEL',
        'அடுத்து': 'NEXT',
        'உதவி': 'HELP',
    },
    te: {
        'బీమా': 'CHOOSE_INSURANCE',
        'అప్పు': 'TAKE_LOAN',
        'పొదుపు': 'SAVE_MONEY',
        'అమ్మకం': 'SELL_CROP',
        'మార్కెట్': 'GO_TO_MARKET',
        'అవును': 'CONFIRM',
        'కాదు': 'CANCEL',
        'తర్వాత': 'NEXT',
        'సహాయం': 'HELP',
    },
    kn: {
        'ವಿಮೆ': 'CHOOSE_INSURANCE',
        'ಸಾಲ': 'TAKE_LOAN',
        'ಉಳಿತಾಯ': 'SAVE_MONEY',
        'ಮಾರಾಟ': 'SELL_CROP',
        'ಮಾರುಕಟ್ಟೆ': 'GO_TO_MARKET',
        'ಹೌದು': 'CONFIRM',
        'ಇಲ್ಲ': 'CANCEL',
        'ಮುಂದೆ': 'NEXT',
        'ಸಹಾಯ': 'HELP',
    },
};

const VoiceCommands = {
    /**
     * Match a transcript to a game action.
     */
    match(transcript: string, langCode: string = 'hi'): GameAction | null {
        if (!transcript) return null;
        const lower = transcript.toLowerCase().trim();
        const map = COMMAND_MAP[langCode as SupportedLanguage] || {};

        for (const [keyword, action] of Object.entries(map)) {
            if (lower.includes(keyword.toLowerCase())) return action;
        }

        // Always try English as universal fallback
        for (const [keyword, action] of Object.entries(COMMAND_MAP['en'])) {
            if (lower.includes(keyword)) return action;
        }

        return null;
    },

    /**
     * Get all keywords that map to a given action in a language.
     */
    getKeywordsForAction(action: GameAction, langCode: string = 'hi'): string[] {
        const map: Record<string, GameAction> = {
            ...(COMMAND_MAP[langCode as SupportedLanguage] || {}),
            ...COMMAND_MAP['en'],
        };
        return Object.entries(map)
            .filter(([, act]) => act === action)
            .map(([kw]) => kw);
    },

    /**
     * Get all supported actions.
     */
    getAllActions(): GameAction[] {
        return [...new Set(Object.values(COMMAND_MAP['en']))] as GameAction[];
    },
};

export default VoiceCommands;

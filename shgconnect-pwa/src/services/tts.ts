import { SupportedLanguage } from '../types/shg';

class TTSService {
  private enabled: boolean = true;
  private currentLang: SupportedLanguage = 'mr';

  constructor() {
    // Check speech synthesis support
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      console.warn("Speech Synthesis not supported in this browser");
    }
  }

  public setEnabled(status: boolean) {
    this.enabled = status;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setLanguage(lang: SupportedLanguage) {
    this.currentLang = lang;
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLang;
  }

  /**
   * Finds the best voice matching Devanagari fallback hierarchy:
   * 1. mr-IN (Marathi)
   * 2. hi-IN (Hindi)
   * 3. en-IN strictly reserved for numbers/currency readouts or English locale
   */
  private getBestVoice(
    voices: SpeechSynthesisVoice[],
    targetLang: SupportedLanguage,
    isNumeric: boolean = false
  ): { voice?: SpeechSynthesisVoice; langCode: string } {
    if (targetLang === 'mr') {
      const mrVoice = voices.find(v => v.lang.toLowerCase().startsWith('mr'));
      if (mrVoice) return { voice: mrVoice, langCode: 'mr-IN' };
      const hiVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
      if (hiVoice) return { voice: hiVoice, langCode: 'hi-IN' }; // Fall back to Hindi Devanagari voice
      if (isNumeric) {
        const enVoice = voices.find(v => v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase().startsWith('en'));
        return { voice: enVoice, langCode: 'en-IN' };
      }
      return { langCode: 'mr-IN' };
    } else if (targetLang === 'hi') {
      const hiVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
      if (hiVoice) return { voice: hiVoice, langCode: 'hi-IN' };
      const mrVoice = voices.find(v => v.lang.toLowerCase().startsWith('mr'));
      if (mrVoice) return { voice: mrVoice, langCode: 'mr-IN' };
      if (isNumeric) {
        const enVoice = voices.find(v => v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase().startsWith('en'));
        return { voice: enVoice, langCode: 'en-IN' };
      }
      return { langCode: 'hi-IN' };
    } else {
      const enVoice = voices.find(v => v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase().startsWith('en'));
      return { voice: enVoice, langCode: 'en-IN' };
    }
  }

  /**
   * Speaks a custom sentence or formatted transaction receipt
   */
  public speakTransaction(memberName: string, memberRegional: string, amount: number, type: string) {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    let textToSpeak = "";

    if (this.currentLang === 'mr') {
      if (type === 'SAVINGS') {
        textToSpeak = `${memberRegional}: ₹${amount} बचत जमा झाली.`;
      } else if (type === 'EMI_REPAYMENT') {
        textToSpeak = `${memberRegional}: ₹${amount} हप्ता भरणा केला.`;
      } else if (type === 'LOAN_DISBURSAL') {
        textToSpeak = `${memberRegional}: ₹${amount} कर्ज मंजूर करण्यात आले.`;
      } else {
        textToSpeak = `${memberRegional}: ₹${amount} व्यवहार पूर्ण झाला.`;
      }
    } else if (this.currentLang === 'hi') {
      if (type === 'SAVINGS') {
        textToSpeak = `${memberRegional}: ₹${amount} बचत जमा की गई।`;
      } else if (type === 'EMI_REPAYMENT') {
        textToSpeak = `${memberRegional}: ₹${amount} किश्त भुगतान हुआ।`;
      } else if (type === 'LOAN_DISBURSAL') {
        textToSpeak = `${memberRegional}: ₹${amount} ऋण दिया गया।`;
      } else {
        textToSpeak = `${memberRegional}: ₹${amount} लेन-देन दर्ज हुआ।`;
      }
    } else {
      textToSpeak = `${memberName}: Rupees ${amount} ${type.toLowerCase().replace('_', ' ')} recorded successfully.`;
    }

    const voices = window.speechSynthesis.getVoices();
    const { voice, langCode } = this.getBestVoice(voices, this.currentLang, false);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCode;
    utterance.rate = 0.88; // Spec: 0.88 calibrated for rural comprehension
    utterance.pitch = 1.0;
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Speak arbitrary text with Devanagari fallback and optional numeric voice targeting
   */
  public speak(message: string, isNumeric: boolean = false) {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices();
    const { voice, langCode } = this.getBestVoice(voices, this.currentLang, isNumeric);

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = langCode;
    utterance.rate = 0.88; // Spec: 0.88 rate
    utterance.pitch = 1.0;
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  }
}

export const tts = new TTSService();

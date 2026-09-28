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
   * Speaks a custom sentence or formatted transaction receipt
   */
  public speakTransaction(memberName: string, memberRegional: string, amount: number, type: string) {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    let textToSpeak = "";
    let langCode = "en-IN";

    if (this.currentLang === 'mr') {
      langCode = "mr-IN";
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
      langCode = "hi-IN";
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
      langCode = "en-IN";
      textToSpeak = `${memberName}: Rupees ${amount} ${type.toLowerCase().replace('_', ' ')} recorded successfully.`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCode;
    utterance.rate = 0.9; // Slightly slower for clear rural voice feedback
    utterance.pitch = 1.0;

    // Find best voice match if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  public speak(message: string) {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    const voices = window.speechSynthesis.getVoices();

    let targetLang = this.currentLang === 'mr' ? 'mr-IN' : this.currentLang === 'hi' ? 'hi-IN' : 'en-IN';

    // Devanagari Voice Fallback Hierarchy: mr-IN -> hi-IN -> en-IN
    if (this.currentLang === 'mr') {
      const mrVoice = voices.find(v => v.lang.startsWith('mr'));
      const hiVoice = voices.find(v => v.lang.startsWith('hi'));
      if (mrVoice) {
        utterance.voice = mrVoice;
        targetLang = 'mr-IN';
      } else if (hiVoice) {
        utterance.voice = hiVoice;
        targetLang = 'hi-IN'; // Fall back to Hindi voice for Devanagari script
      } else {
        targetLang = 'en-IN';
      }
    } else if (this.currentLang === 'hi') {
      const hiVoice = voices.find(v => v.lang.startsWith('hi'));
      if (hiVoice) {
        utterance.voice = hiVoice;
        targetLang = 'hi-IN';
      } else {
        targetLang = 'en-IN';
      }
    }

    utterance.lang = targetLang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

export const tts = new TTSService();

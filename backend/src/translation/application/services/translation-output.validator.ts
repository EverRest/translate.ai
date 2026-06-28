import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { stripWrappingQuotes } from '../../../shared/utils/string.utils';

export type ValidationResult = {
  valid: boolean;
  reason?: string;
  score?: number;
};

const REFUSAL_PATTERNS: RegExp[] = [
  /\bi cannot translate\b/i,
  /\bi can't translate\b/i,
  /\bas an ai\b/i,
  /\bas a language model\b/i,
  /\bhere is the translation\b/i,
  /\bhere's the translation\b/i,
  /\btranslation:\s*$/i,
  /\bi'm sorry\b/i,
  /\bi am sorry\b/i,
  /\bunable to translate\b/i,
  /\bcannot provide\b/i,
];

const CYRILLIC_TARGET_LANGS = new Set([
  'ua',
  'uk',
  'ru',
  'bg',
  'sr',
  'be',
  'mk',
]);

const LATIN_TARGET_LANGS = new Set([
  'en',
  'de',
  'fr',
  'es',
  'it',
  'pt',
  'nl',
  'pl',
  'sv',
  'da',
  'no',
  'fi',
  'cs',
  'sk',
  'ro',
  'hu',
  'tr',
]);

@Injectable()
export class TranslationOutputValidator {
  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('TRANSLATION_VALIDATION_ENABLED', true);
  }

  validate(
    output: string,
    sourceText: string,
    sourceLang: string,
    targetLang: string,
  ): ValidationResult {
    if (!this.isEnabled()) {
      return { valid: true, score: 1 };
    }

    const trimmed = output.trim();
    if (!trimmed) {
      return { valid: false, reason: 'Translation output is empty' };
    }

    if (this.isQuoteOnly(trimmed)) {
      return {
        valid: false,
        reason: 'Translation output contains only quotes',
      };
    }

    for (const pattern of REFUSAL_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          valid: false,
          reason: 'Translation output looks like a refusal or meta reply',
        };
      }
    }

    const normalizedSource = sourceText.trim();
    const normalizedOutput = trimmed;
    if (
      sourceLang.toLowerCase() !== targetLang.toLowerCase() &&
      normalizedSource.length > 0 &&
      normalizedSource.toLowerCase() === normalizedOutput.toLowerCase()
    ) {
      return {
        valid: false,
        reason: 'Translation is identical to source text',
      };
    }

    const lengthIssue = this.checkLengthRatio(
      normalizedSource,
      normalizedOutput,
    );
    if (lengthIssue) {
      return lengthIssue;
    }

    const scriptIssue = this.checkScript(normalizedOutput, targetLang);
    if (scriptIssue) {
      return scriptIssue;
    }

    return { valid: true, score: 0.85 };
  }

  private isQuoteOnly(text: string): boolean {
    const stripped = stripWrappingQuotes(text).trim();
    return stripped.length === 0;
  }

  private checkLengthRatio(
    source: string,
    output: string,
  ): ValidationResult | null {
    if (source.length < 4) {
      return null;
    }

    const ratio = output.length / source.length;
    if (ratio > 5) {
      return {
        valid: false,
        reason: 'Translation output is unusually long compared to source',
      };
    }

    if (ratio < 0.1 && source.length > 20) {
      return {
        valid: false,
        reason: 'Translation output is unusually short compared to source',
      };
    }

    return null;
  }

  private checkScript(
    output: string,
    targetLang: string,
  ): ValidationResult | null {
    const lang = targetLang.toLowerCase();
    const letters = output.replace(/[\s\d\p{P}\p{S}]/gu, '');
    if (letters.length < 3) {
      return null;
    }

    const cyrillicCount = (letters.match(/[\u0400-\u04FF]/g) ?? []).length;
    const latinCount = (letters.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) ?? []).length;
    const cyrillicRatio = cyrillicCount / letters.length;
    const latinRatio = latinCount / letters.length;

    if (
      CYRILLIC_TARGET_LANGS.has(lang) &&
      latinRatio > 0.85 &&
      cyrillicRatio < 0.1
    ) {
      return {
        valid: false,
        reason: `Translation output does not appear to use expected script for ${lang}`,
      };
    }

    if (LATIN_TARGET_LANGS.has(lang) && cyrillicRatio > 0.5) {
      return {
        valid: false,
        reason: `Translation output uses unexpected script for ${lang}`,
      };
    }

    return null;
  }
}

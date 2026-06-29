export type GlossaryPresetTerm = {
  sourceTerm: string;
  targetTerm?: string;
  doNotTranslate?: boolean;
  note?: string;
};

export type GlossaryPreset = {
  id: string;
  name: string;
  description: string;
  terms: GlossaryPresetTerm[];
};

const PRESETS: GlossaryPreset[] = [
  {
    id: 'ui_common_en',
    name: 'UI common (EN hints)',
    description:
      'Common UI labels — mostly do-not-translate hints for English source projects',
    terms: [
      { sourceTerm: 'Title', doNotTranslate: false, note: 'UI label' },
      { sourceTerm: 'Label', doNotTranslate: false, note: 'UI label' },
      { sourceTerm: 'Description', doNotTranslate: false, note: 'UI label' },
      { sourceTerm: 'Submit', doNotTranslate: false, note: 'UI action' },
      { sourceTerm: 'Cancel', doNotTranslate: false, note: 'UI action' },
      { sourceTerm: 'Save', doNotTranslate: false, note: 'UI action' },
      { sourceTerm: 'Delete', doNotTranslate: false, note: 'UI action' },
      { sourceTerm: 'Error', doNotTranslate: false, note: 'UI label' },
      { sourceTerm: 'Required', doNotTranslate: false, note: 'Validation' },
    ],
  },
  {
    id: 'ui_common_en_ru',
    name: 'UI common (EN → RU)',
    description: 'Preferred Russian translations for common UI terms',
    terms: [
      { sourceTerm: 'Title', targetTerm: 'Заголовок' },
      { sourceTerm: 'Label', targetTerm: 'Метка' },
      { sourceTerm: 'Description', targetTerm: 'Описание' },
      { sourceTerm: 'Submit', targetTerm: 'Отправить' },
      { sourceTerm: 'Cancel', targetTerm: 'Отмена' },
      { sourceTerm: 'Save', targetTerm: 'Сохранить' },
      { sourceTerm: 'Delete', targetTerm: 'Удалить' },
      { sourceTerm: 'Error', targetTerm: 'Ошибка' },
      { sourceTerm: 'Required', targetTerm: 'Обязательно' },
    ],
  },
  {
    id: 'do_not_translate',
    name: 'Do not translate',
    description: 'Technical tokens that should stay unchanged',
    terms: [
      { sourceTerm: 'API', doNotTranslate: true },
      { sourceTerm: 'URL', doNotTranslate: true },
      { sourceTerm: 'ID', doNotTranslate: true },
      { sourceTerm: 'OAuth', doNotTranslate: true },
      { sourceTerm: 'PDF', doNotTranslate: true },
      { sourceTerm: 'VIP', doNotTranslate: true },
    ],
  },
];

export function listGlossaryPresets(): GlossaryPreset[] {
  return PRESETS.map((preset) => ({
    ...preset,
    terms: [...preset.terms],
  }));
}

export function getGlossaryPreset(id: string): GlossaryPreset | undefined {
  const preset = PRESETS.find((item) => item.id === id);
  if (!preset) {
    return undefined;
  }
  return { ...preset, terms: [...preset.terms] };
}

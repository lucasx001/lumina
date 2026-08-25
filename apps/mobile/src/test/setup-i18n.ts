type TestMessage = string | { id?: string; message?: string };

jest.mock('react-native-toast-message', () => {
  const Toast = Object.assign(() => null, { show: jest.fn(), hide: jest.fn() });
  return { __esModule: true, default: Toast };
});

function mockTranslate(message: TestMessage, values?: Record<string, unknown>): string {
  const template = typeof message === 'string' ? message : (message.message ?? message.id ?? '');

  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

jest.mock('@lingui/react', () => ({
  I18nProvider: ({ children }: { children: unknown }) => children,
  Trans: ({ children, id }: { children: unknown; id?: string }) => children ?? id ?? '',
  useLingui: () => ({
    _: mockTranslate,
    i18n: { _: mockTranslate, locale: 'en' },
  }),
}));

import SemanticReleaseError from '@semantic-release/error';

type ErrorCodes = 'ENRNANDROIDPATH' | 'ENRNIOSPATH';

type ErrorDefinition = {
  message: string;
  details: string;
};

const ERROR_DEFINITIONS: Record<ErrorCodes, ErrorDefinition> = {
  ENRNANDROIDPATH: {
    message: 'Invalid `androidPath`',
    details: 'The `androidPath` must point to an existing build.gradle file.',
  },
  ENRNIOSPATH: {
    message: 'Invalid `iosPath`',
    details: 'The `iosPath` must point to an existing directory.',
  },
};

export const getError = (code: ErrorCodes) => {
  const { message, details } = ERROR_DEFINITIONS[code];

  return new SemanticReleaseError(message, code, details);
};

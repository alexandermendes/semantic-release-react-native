import { PluginConfig } from './types';

export class SemanticReleaseError extends Error {
  name: 'SemanticReleaseError';

  code: string;

  details: string;

  semanticRelease: true;

  constructor(message: string, code: string, details: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = 'SemanticReleaseError';
    this.code = code;
    this.details = details;
    this.semanticRelease = true;
  }
}

type ErrorCodes = 'ENRNANDROIDPATH'
  | 'ENRNIOSPATH'
  | 'ENRNNOTBOOLEAN'
  | 'ENRNNOTSTRING'
  | 'ENRNVERSIONSTRATEGY';

type ErrorDefinition = (key: keyof PluginConfig) => {
  message: string;
  details: string;
};

const ERROR_DEFINITIONS: Record<ErrorCodes, ErrorDefinition> = {
  ENRNANDROIDPATH: (key: keyof PluginConfig) => ({
    message: `Invalid ${key}`,
    details: `The ${key} must point to an existing build.gradle file.`,
  }),
  ENRNIOSPATH: (key: keyof PluginConfig) => ({
    message: `Invalid ${key}`,
    details: `The ${key} must point to an existing directory.`,
  }),
  ENRNNOTBOOLEAN: (key: keyof PluginConfig) => ({
    message: `Invalid ${key}`,
    details: `The ${key} must be a boolean.`,
  }),
  ENRNNOTSTRING: (key: keyof PluginConfig) => ({
    message: `Invalid ${key}`,
    details: `The ${key} must be a string.`,
  }),
  ENRNVERSIONSTRATEGY: (key: keyof PluginConfig) => ({
    message: `Invalid ${key}`,
    details: `The ${key} must comply with the schema (see docs).`,
  }),
};

export const getError = (key: keyof PluginConfig, code: ErrorCodes) => {
  const { message, details } = ERROR_DEFINITIONS[code](key);

  return new SemanticReleaseError(message, code, details);
};

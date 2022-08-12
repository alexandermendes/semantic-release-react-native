declare module '@semantic-release/error' {
  class SemanticReleaseError extends Error {
    public message: string;

    public code: string;

    public details: string;

    public semanticRelease: true;

    constructor (message: string, code: string, details: string)
  }

  export = SemanticReleaseError;
}


'use client';

/**
 * Defines the context of a Firestore operation that failed due to security rules.
 */
type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
};

/**
 * A custom error class designed to report Firestore permission errors
 * without crashing the Next.js development overlay.
 */
export class FirestorePermissionError extends Error {
  constructor(context: SecurityRuleContext) {
    const message = `FirestorePermissionError: Missing or insufficient permissions. The ${context.operation} operation on path '${context.path}' was denied by security rules.`;
    super(message);
    this.name = 'FirestorePermissionError';

    // It's often helpful to be able to access the context programmatically.
    Object.defineProperty(this, 'context', {
        value: context,
        enumerable: false // Hide from JSON.stringify and console.log object expansion
    });
  }
}

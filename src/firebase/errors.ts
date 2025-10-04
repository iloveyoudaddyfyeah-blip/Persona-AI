
'use client';
import { getAuth, type User } from 'firebase/auth';

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface FirebaseAuthToken {
  name: string | null;
  email: string | null;
  email_verified: boolean;
  phone_number: string | null;
  sub: string;
  firebase: {
    identities: Record<string, string[]>;
    sign_in_provider: string;
    tenant: string | null;
  };
}

interface FirebaseAuthObject {
  uid: string;
  token: FirebaseAuthToken;
}

interface SecurityRuleRequest {
  auth: FirebaseAuthObject | null;
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a security-rule-compliant auth object from the Firebase User.
 * @param currentUser The currently authenticated Firebase user.
 * @returns An object that mirrors request.auth in security rules, or null.
 */
function buildAuthObject(currentUser: User | null): FirebaseAuthObject | null {
  if (!currentUser) {
    return null;
  }

  const token: FirebaseAuthToken = {
    name: currentUser.displayName,
    email: currentUser.email,
    email_verified: currentUser.emailVerified,
    phone_number: currentUser.phoneNumber,
    sub: currentUser.uid,
    firebase: {
      identities: currentUser.providerData.reduce((acc, p) => {
        if (p.providerId) {
          acc[p.providerId] = [p.uid];
        }
        return acc;
      }, {} as Record<string, string[]>),
      sign_in_provider: currentUser.providerData[0]?.providerId || 'custom',
      tenant: currentUser.tenantId,
    },
  };

  return {
    uid: currentUser.uid,
    token: token,
  };
}

const MAX_STRING_LENGTH = 500;

/**
 * Safely truncates long strings within a nested object/array structure
 * and handles circular references to prevent call stack errors.
 * @param data The data to process.
 * @returns A deep copy of the data with long strings truncated.
 */
function truncateData(data: any): any {
  // Keep track of visited objects to detect cycles.
  const visited = new WeakSet();

  function recurse(current: any): any {
    // Base cases: null, undefined, or primitive types (except strings)
    if (current === null || typeof current !== 'object') {
      if (typeof current === 'string' && current.length > MAX_STRING_LENGTH) {
        return current.substring(0, MAX_STRING_LENGTH) + '...[TRUNCATED]';
      }
      return current;
    }

    // If we've seen this object before, it's a circular reference.
    if (visited.has(current)) {
      return '[Circular Reference]';
    }

    // Mark the object as visited.
    visited.add(current);

    // Handle arrays
    if (Array.isArray(current)) {
      const newArray: any[] = [];
      for (const item of current) {
        newArray.push(recurse(item));
      }
      return newArray;
    }
    
    // Handle objects
    const newObj: { [key: string]: any } = {};
    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        newObj[key] = recurse(current[key]);
      }
    }
    return newObj;
  }

  return recurse(data);
}


/**
 * Builds the complete, simulated request object for the error message.
 * It safely tries to get the current authenticated user.
 * @param context The context of the failed Firestore operation.
 * @returns A structured request object.
 */
function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  let authObject: FirebaseAuthObject | null = null;
  try {
    // Safely attempt to get the current user.
    const firebaseAuth = getAuth();
    const currentUser = firebaseAuth.currentUser;
    if (currentUser) {
      authObject = buildAuthObject(currentUser);
    }
  } catch {
    // This will catch errors if the Firebase app is not yet initialized.
    // In this case, we'll proceed without auth information.
  }
  
  const truncatedData = context.requestResourceData ? truncateData(context.requestResourceData) : undefined;

  return {
    auth: authObject,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: truncatedData ? { data: truncatedData } : undefined,
  };
}

/**
 * Builds the final, formatted error message for the LLM.
 * @param requestObject The simulated request object.
 * @returns A string containing the error message and the JSON payload.
 */
function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  try {
    return `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(requestObject, null, 2)}`;
  } catch (e) {
    // Fallback for any unforeseen stringify errors
    return `Missing or insufficient permissions. Failed to stringify the detailed error. Operation: ${requestObject.method}, Path: ${requestObject.path}`;
  }
}

/**
 * A custom error class designed to be consumed by an LLM for debugging.
 * It structures the error information to mimic the request object
 * available in Firestore Security Rules.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject = buildRequestObject(context);
    super(buildErrorMessage(requestObject));
    this.name = 'FirestorePermissionError';
    this.request = requestObject;
  }
}

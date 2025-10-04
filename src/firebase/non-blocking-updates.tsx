
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
  Firestore,
  doc,
} from 'firebase/firestore';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  setDoc(docRef, data, options || {}).catch(error => {
    console.error(`Error setting document at ${docRef.path}:`, error);
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      console.error(`Error adding document to ${colRef.path}:`, error);
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      console.error(`Error updating document at ${docRef.path}:`, error);
    });
}

export function updateUser(firestore: Firestore, userId: string, data: any): void {
  const userRef = doc(firestore, `users/${userId}`);
  // Use setDoc with merge instead of updateDoc to handle document creation if it doesn't exist.
  // This is safer for the user settings document.
  setDocumentNonBlocking(userRef, data, { merge: true });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      console.error(`Error deleting document at ${docRef.path}:`, error);
    });
}

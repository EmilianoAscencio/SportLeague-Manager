import { db, auth } from "./firebase.js";
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Crea un documento agregando createdAt, updatedAt, createdBy y active
export async function createDocument(collectionName, data) {
  try {
    const ref = await addDoc(collection(db, collectionName), {
      ...data,
      active: true,
      createdBy: auth.currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Obtiene todos los documentos de una colección
export async function getDocuments(collectionName) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Obtiene un documento por su ID
export async function getDocumentById(collectionName, id) {
  try {
    const ref = doc(db, collectionName, id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return { success: false, message: "Documento no encontrado." };
    return { success: true, data: { id: snapshot.id, ...snapshot.data() } };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Actualiza un documento agregando updatedAt automáticamente
export async function updateDocument(collectionName, id, data) {
  try {
    const ref = doc(db, collectionName, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Elimina un documento de forma permanente
export async function deleteDocument(collectionName, id) {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Activa o desactiva un documento cambiando el campo active
export async function toggleActive(collectionName, id, currentState) {
  try {
    const ref = doc(db, collectionName, id);
    await updateDoc(ref, {
      active: !currentState,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Verifica si ya existe un documento con el mismo valor en un campo dado
export async function checkDuplicate(collectionName, field, value, excludeId = null) {
  try {
    const q = query(collection(db, collectionName), where(field, "==", value));
    const snapshot = await getDocs(q);
    const duplicates = snapshot.docs.filter((doc) => doc.id !== excludeId);
    return { success: true, isDuplicate: duplicates.length > 0 };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
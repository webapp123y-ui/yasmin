import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { initializeFirestore, collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getDatabase, ref, set } from "firebase/database";

// 🔹 إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBpk8rNy7ghyJUUNvy7g3UgJolDx_HWyqE",
  authDomain: "my-students-359ba.firebaseapp.com",
  projectId: "my-students-359ba",
  storageBucket: "my-students-359ba.appspot.com",
  messagingSenderId: "405369279934",
  appId: "1:405369279934:web:d0a8ede5fa21e93e6f55ef",
  databaseURL: "https://my-students-359ba-default-rtdb.firebaseio.com"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 🔹 Firestore (Forced Long Polling to fix connection issues)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// 🔹 Realtime Database
export const rtdb = getDatabase(app);

// 🔹 Google Login
export const handleGoogleLogin = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error('Login failed', error);
    if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/network-request-failed') {
      alert('خطأ: النطاق غير مصرح به أو فشل الاتصال. يرجى إضافة نطاق الموقع (run.app) في إعدادات Firebase Console.');
    } else if (error.code === 'auth/operation-not-allowed') {
      alert('خطأ: يجب تفعيل تسجيل الدخول بـ Google في إعدادات Firebase Console.');
    } else {
      alert('فشل تسجيل الدخول: ' + error.message);
    }
  }
};

// 🔹 تسجيل دخول يدوي
export const handleEmailLogin = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error("فشل تسجيل الدخول:", error.message);

    if (error.code === "auth/operation-not-allowed") {
      alert("خطأ: يجب تفعيل 'Email/Password' في إعدادات Firebase Console (قسم Authentication).");
    }
  }
};

// 🔹 تسجيل خروج
export const handleLogout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("فشل تسجيل الخروج:", error);
  }
};

// 🔹 حفظ بيانات الملف الشخصي للمستخدم
export const saveUserProfile = async (user: User) => {
  try {
    const userDoc = doc(db, "users", user.uid);
    await setDoc(userDoc, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString()
    }, { merge: true });
    
    // Also save to RTDB
    await set(ref(rtdb, `users/${user.uid}`), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString()
    });
    
    console.log("User profile saved!");
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
};

// 🔹 حفظ بيانات التطبيق (الطلاب، الفصول، الشهور)
export const saveAppData = async (userId: string, data: any) => {
  try {
    const dataDoc = doc(db, "appData", userId);
    await setDoc(dataDoc, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("App data saved to Firestore!");
  } catch (error) {
    console.error("Error saving app data:", error);
  }
};

// 🔹 جلب بيانات التطبيق
export const fetchAppData = async (userId: string) => {
  try {
    const dataDoc = doc(db, "appData", userId);
    const snapshot = await getDoc(dataDoc);
    if (snapshot.exists()) return snapshot.data();
    return null;
  } catch (error) {
    console.error("Error fetching app data:", error);
    return null;
  }
};

// 🔹 تسجيل الدخول باستخدام حساب ثابت (وإنشاؤه إذا لم يكن موجوداً)
export const loginFixedUser = async () => {
  const email = "yasmin@example.com"; // الحساب الثابت
  const password = "123456";           // الباسورد الثابت
  try {
    // محاولة تسجيل الدخول أولاً
    await signInWithEmailAndPassword(auth, email, password);
    console.log("تم تسجيل الدخول بنجاح!");
  } catch (error: any) {
    // إذا كان الحساب غير موجود أو البيانات خاطئة، نحاول إنشاء الحساب
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
      console.log("الحساب غير موجود، جاري إنشاؤه...");
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("تم إنشاء الحساب الثابت وتسجيل الدخول بنجاح!");
      } catch (signUpError: any) {
        console.error("فشل إنشاء الحساب التلقائي:", signUpError.message);
      }
    } else {
      console.error("فشل تسجيل الدخول:", error.message);
    }
  }
};

// 🔹 جلب بيانات المستخدم الحالي فقط
export const fetchMyData = async () => {
  if (!auth.currentUser) return null;
  const userDoc = doc(db, "users", auth.currentUser.uid);
  const snapshot = await getDoc(userDoc);
  if (snapshot.exists()) return snapshot.data();
  return null;
};

// 🔹 تصدير باقي الدوال
export { 
  signInWithPopup, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut
};
export type { User };

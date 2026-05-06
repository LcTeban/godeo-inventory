import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyB51Y-fnSEWojYOTyGi7MIVEX2DbFgG-QA",
  authDomain: "godeo-inventory.firebaseapp.com",
  projectId: "godeo-inventory",
  storageBucket: "godeo-inventory.firebasestorage.app",
  messagingSenderId: "633055021311",
  appId: "1:633055021311:web:aaa083691608923cada4ca"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BHsZBAMtJoPgC9ZBGetjQwNJiCR46pzlItTQj6CguCSCrOzQVf-eu8Wa9Oh6vllfJALA8uOPhtjjLh1nNf6hv-U'
      });
      return { success: true, token };
    }
    return { success: false, error: 'Permiso denegado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const onMessageListener = (callback) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export { messaging };

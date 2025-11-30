// ===================================================
//  JUJKY.COM - ANALYTICS SCRIPT (APPS VERSION)
//  Full logging for: visits, clicks, downloads
// ===================================================

// Firebase importy
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCMifD1WL04-WNN2euciK2epNCUP5qNFpA",
    authDomain: "web-analytics-f6777.firebaseapp.com",
    projectId: "web-analytics-f6777",
    storageBucket: "web-analytics-f6777.firebasestorage.app",
    messagingSenderId: "507005327319",
    appId: "1:507005327319:web:cb513fdd8efe135842dd92"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Hezký formát času
function formatTime(ts = Date.now()) {
    return new Date(ts).toLocaleString("cs-CZ", {
        timeZone: "Europe/Prague",
        hour12: false
    });
}

// Browser info
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    let os = "Unknown";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "MacOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone")) os = "iOS";

    return { browser, os };
}

// Unikátní ID návštěvy
const startTime = Date.now();
const visitId = `${startTime}-${Math.floor(Math.random() * 100000)}`;

// Základní data
const visitData = {
    page: "apps",
    info: {
        url: window.location.href,
        referrer: document.referrer || "direct",
        browser: getBrowserInfo().browser,
        os: getBrowserInfo().os,
        device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
        screen: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    session: {
        startTime,
        startReadable: formatTime(startTime),
        lastUpdate: startTime,
        lastReadable: formatTime(startTime),
        timeSpent: 0
    },
    actions: []
};

// Reference ve Firestore
const visitRef = doc(collection(db, "visits_apps"), visitId);

// Uloží první verzi
await setDoc(visitRef, visitData);

// Pravidelné updatu (každých 5s)
const interval = setInterval(async () => {
    const now = Date.now();
    const timeSpent = Math.round((now - startTime) / 1000);

    try {
        await updateDoc(visitRef, {
            "session.timeSpent": timeSpent,
            "session.lastUpdate": now,
            "session.lastReadable": formatTime(now)
        });
    } catch (e) {
        console.error("Heartbeat failed:", e);
    }
}, 5000);

// ============================================
// LOGGING FUNKCE
// ============================================

// kliknutí na appku (otevření detailu)
export async function logOpenApp(appName) {
    const now = Date.now();
    try {
        await updateDoc(visitRef, {
            actions: arrayUnion({
                type: "open_app",
                app: appName,
                timestamp: now,
                readable: formatTime(now)
            })
        });
    } catch (e) {
        console.error("logOpenApp failed:", e);
    }
}

// stažení app verze
export async function logDownload(appName, versionName, url) {
    const now = Date.now();
    try {
        await updateDoc(visitRef, {
            actions: arrayUnion({
                type: "download",
                app: appName,
                version: versionName,
                url,
                timestamp: now,
                readable: formatTime(now)
            })
        });
    } catch (e) {
        console.error("logDownload failed:", e);
    }
}

// externí link (IG, GitHub…)
export async function logExternal(label, url) {
    const now = Date.now();
    try {
        await updateDoc(visitRef, {
            actions: arrayUnion({
                type: "external_click",
                label,
                url,
                timestamp: now,
                readable: formatTime(now)
            })
        });
    } catch (e) {
        console.error("logExternal failed:", e);
    }
}

// Konec session
window.addEventListener("beforeunload", async () => {
    clearInterval(interval);
    const end = Date.now();
    const total = Math.round((end - startTime) / 1000);

    try {
        await updateDoc(visitRef, {
            "session.endTime": end,
            "session.endReadable": formatTime(end),
            "session.timeSpent": total,
            actions: arrayUnion({
                type: "session_end",
                totalTime: total,
                timestamp: end,
                readable: formatTime(end)
            })
        });
    } catch (e) {
        console.error("Unload update failed:", e);
    }
});

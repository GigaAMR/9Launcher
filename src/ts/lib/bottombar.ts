import { MessageDialogOptions, message } from "@tauri-apps/api/dialog";
import { dialog } from "@tauri-apps/api";
import infoManager from "./infoManager";
import dashboard from "../dashboard";
import { invoke } from "@tauri-apps/api";
import { setGameRichPresence } from "./games";
import { Storage } from "../utils/handleLocalStorage";

const settingsDiv = document.getElementById("settings-icn") as HTMLDivElement;
const infoPageIcon = document.getElementById("info-page") as HTMLDivElement;
const appInfo = document.getElementById("app-info") as HTMLDivElement;
const quickSettings = document.getElementById("quick-settings") as HTMLDivElement;
const notificationSlider = document.getElementById("notifications-slider") as HTMLInputElement;
const rpcSlider = document.getElementById("discord-rpc-slider") as HTMLInputElement;
const rpcSliderRound = document.getElementById("rpc-slider-round") as HTMLDivElement;
const fileLoggingSlider = document.getElementById("file-logging-slider") as HTMLInputElement;
const consoleInfoSlider = document.getElementById("console-slider") as HTMLInputElement;
const clearGames = document.getElementById("clear-games-btn") as HTMLButtonElement;
const wineManager = document.getElementById("wine-manager-btn") as HTMLButtonElement;
const dosboxManager = document.getElementById("dosbox-manager-btn") as HTMLButtonElement;

const osInfo = document.getElementById("os-info") as HTMLParagraphElement;
const kernelInfo = document.getElementById("kernel-info") as HTMLParagraphElement;
const archInfo = document.getElementById("arch-info") as HTMLParagraphElement;
const versionInfo = document.getElementById("version-info") as HTMLParagraphElement;

const copyInfoBtn = document.getElementById("copy-info") as HTMLButtonElement;

let info = await infoManager.gatherInformation();
let quickSettingsToggle = 0;
let infoPageToggle = 0;

if (info.platform == "win32") {
    document.getElementById("wine-manager")?.remove();
}

function setSliderState(element: HTMLInputElement, state: boolean) {
    if (state) element.checked = state;
}
setSliderState(notificationSlider, Storage.get("libraryUpdateAlerts") === "enabled" ? true : false);
setSliderState(rpcSlider, Storage.get("discordRPC") === "enabled" ? true : false);
setSliderState(fileLoggingSlider, Storage.get("file-logging") === "enabled" ? true : false);
setSliderState(consoleInfoSlider, Storage.get("console-logging") === "enabled" ? true : false);

if (Storage.get("discordRPC") === null) {
    Storage.set("discordRPC", "enabled");
    setGameRichPresence();
    window.location.reload();
}
if (Storage.get("file-logging") === null) Storage.set("file-logging", "enabled");
if (Storage.get("libraryUpdateAlerts") === null) Storage.set("libraryUpdateAlerts", "enabled");
if (Storage.get("console-logging") === null) Storage.set("console-logging", "enabled");

if (settingsDiv !== null) {
    settingsDiv.addEventListener("click", () => {
        if (quickSettingsToggle == 0) {
            quickSettings.classList.add("modal-active");
            quickSettingsToggle = 1;
            quickSettings.style.pointerEvents = "auto";
        } else {
            quickSettings.classList.remove("modal-active");
            quickSettingsToggle = 0;
            quickSettings.style.pointerEvents = "none";
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && quickSettingsToggle == 1) {
            quickSettings.style.opacity = "0";
            quickSettingsToggle = 0;
        }
    });
    notificationSlider.addEventListener("change", (event) => {
        if ((<HTMLInputElement>event.currentTarget).checked) {
            Storage.set("libraryUpdateAlerts", "enabled");
        } else {
            Storage.set("libraryUpdateAlerts", "disabled");
        }
    });
    rpcSlider.addEventListener("change", (event) => {
        if (rpcSliderRound == null) return;
        rpcSliderRound.dataset.tempDisabled = "enabled";
        rpcSlider.disabled = true;
        setTimeout(() => {
            delete rpcSliderRound.dataset.tempDisabled;
            rpcSlider.disabled = false;
        }, 1500);
        if ((event.currentTarget as HTMLInputElement).checked) {
            Storage.set("discordRPC", "enabled");
            setGameRichPresence();
        } else {
            Storage.set("discordRPC", "disabled");
            invoke("clear_activity");
        }
    });
    fileLoggingSlider.addEventListener("change", (event) => {
        if ((event.currentTarget as HTMLInputElement).checked) {
            Storage.set("file-logging", "enabled");
        } else {
            Storage.set("file-logging", "disabled");
        }
    });
    consoleInfoSlider.addEventListener("change", (event) => {
        if ((event.currentTarget as HTMLInputElement).checked) {
            Storage.set("console-logging", "enabled");
        } else {
            Storage.set("console-logging", "disabled");
        }
    });
    clearGames.addEventListener("click", async () => {
        return await dialog
            .confirm(
                "Are you sure you want to clear your library? This will remove all games from your library, and you will have to re-add them.",
                {
                    title: "9Launcher",
                },
            )
            .then(async (response) => {
                if (response == true) {
                    let libalertskey = Storage.get("libraryUpdateAlerts");
                    Storage.clear();
                    Storage.set("libraryUpdateAlerts", libalertskey as string);
                    await messageBox("Library cleared!", { type: "info", title: "Success!" });
                    window.location.reload();
                }
            });
    });
    dosboxManager.addEventListener("click", () => {
        dashboard.dosboxOpenModal();
    });
    wineManager.addEventListener("click", () => {
        dashboard.openWineManager();
    });
}

function addInfoPageEvents() {
    if (infoPageIcon == null || infoPageIcon == undefined) return;
    infoPageIcon.addEventListener("click", () => {
        if (infoPageToggle == 0) {
            appInfo.classList.add("modal-active");
            infoPageToggle = 1;
            appInfo.style.pointerEvents = "auto";
        } else {
            appInfo.classList.remove("modal-active");
            infoPageToggle = 0;
            appInfo.style.pointerEvents = "none";
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && infoPageToggle == 1) {
            appInfo.style.opacity = "0";
            infoPageToggle = 0;
        }
    });
}
addInfoPageEvents();

let os = info.OS;
let kernelVersion = info.kernelVersion;
let arch = info.architecture;
let appVersion = info.version;
versionInfo.textContent = "Version: " + appVersion;
osInfo.textContent = "OS: " + os;
kernelInfo.textContent = "Kernel Version: " + kernelVersion;
archInfo.textContent = "Architecture: " + arch;
copyInfoBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(`
        OS: ${os}\n
        Kernel Version: ${kernelVersion}\n
        Architecture: ${arch}\n
        Version: ${appVersion}
    `);
    messageBox("Copied device info to clipboard!", { type: "info", "title": "Success!" });
});

async function messageBox(str: string, type: MessageDialogOptions) {
    if (Storage.get("libraryUpdateAlerts") === "disabled") return;
    await message(str, type);
}

// WHY WONT AUDIO PLAY FROM THE BUNDLED APP?????????
// You've forced my hand, this is disabled for now until I get unlazy and implement it in rust or something, works just fine in dev mode.
// Seriously if someone is looking through this code and can see where I fucked up, please tell me!!
// And no, its not because I reference /src/assets/warui.mp3, that gets rewritten by Vite properly.

// let waruicount = 0;
// let iswaruiplaying = false;

// function inconspicuous() {
//     const soundURL = new URL('/src/assets/warui.mp3', import.meta.url);
//     if (document.getElementById('inconspicuous') == null || document.getElementById('inconspicuous') == undefined) return;
//     let inconspicuous = document.getElementById('inconspicuous') as HTMLDivElement;
//     inconspicuous.addEventListener('click', () => {
//         if (waruicount < 2 && iswaruiplaying == false) {
//             waruicount++;
//             try {
//                 const warui = new Audio(soundURL.href)
//                 warui.addEventListener('ended', () => {
//                     iswaruiplaying = false;
//                 })
//                 alert("Should be playing....")
//                 warui.play();
//             } catch (err) {
//                 alert(err)
//             }
//             iswaruiplaying = true;
//         }
//         if (waruicount == 2) {
//             return waruicount++
//         }
//         if (waruicount == 3) {
//             localStorage.setItem("achievements", JSON.stringify({"warui": true}));
//             let waruielem = document.getElementById('inconspicous-character')
//             if (waruielem == null) return
//             waruielem.style.opacity = "0";
//             setTimeout(() => {
//                 waruielem?.remove();
//             }, 260);
//         }
//         return false;
//     });
// }
// inconspicuous();

export default messageBox;

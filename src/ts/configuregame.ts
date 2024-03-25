import { allGames, isGameIDValid } from "./gamesInterface";
import * as dialog from "@tauri-apps/api/dialog";
import * as fs from "@tauri-apps/api/fs";
import { APPDATA_PATH } from "./globals";
import { emit } from "@tauri-apps/api/event";
import { platform } from "@tauri-apps/api/os";
import { returnCode } from "./lib/types/types";

const urlParams = new URLSearchParams(window.location.search);
const gameID = urlParams.get("id") as string;

if (isGameIDValid(gameID) === returnCode.FALSE) {
    throw new Error("Invalid game ID!");
}

const game = allGames[gameID as keyof typeof allGames];

let gameData: any = null;
if (localStorage.getItem(game.game_id) !== null) {
    gameData = JSON.parse(localStorage.getItem(game.game_id) as string);
}

let customImagesDir: string =
    (await platform()) == "win32" ? APPDATA_PATH + "custom-img\\" : APPDATA_PATH + "custom-img/";
let title = document.getElementById("game-title");
let gameImage = document.getElementById("game-image");

async function setupConfigureMenu() {
    if (title === null) throw new Error("Couldn't find game title element");
    title.textContent += game.en_title + ": ";
    if (gameImage === null) throw new Error("Couldn't find game image element");
    if (game.img === null) throw new Error("Game image is null");
    gameImage.setAttribute("src", "/assets/game-images/" + game.img);
    let deleteGame = document.getElementById("delete-game");
    if (deleteGame === null) throw new Error("Couldn't find delete game element");
    deleteGame.addEventListener("click", async () => {
        removeGame();
    });
}
setupConfigureMenu();
async function removeGame() {
    let confirm = await dialog.confirm(
        "This will remove the game from your library, but will not delete the game files.",
        `Remove ${game.en_title}?`,
    );
    if (confirm) {
        emit("delete-game", game.game_id);
    } else {
        return;
    }
}

async function setCurrentImage() {
    if (!(await fs.exists(customImagesDir + game.game_id + ".png"))) return;
    let image = await fs.readBinaryFile(customImagesDir + game.game_id + ".png");
    let blob = new Blob([image], { type: "image/png" });
    let url = URL.createObjectURL(blob);
    if (gameImage === null) throw new Error("Couldn't find game image element");
    gameImage.setAttribute("src", url);
}
setCurrentImage();

async function setNewImage() {
    if (!(await fs.exists(customImagesDir))) {
        await fs.createDir(customImagesDir, { recursive: true });
    }
    let newImage = await dialog.open({
        multiple: false,
        directory: false,
        filters: [
            {
                name: "Images",
                extensions: ["jpg", "png", "gif"],
            },
        ],
    });
    if (newImage === undefined) return;
    fs.copyFile(newImage as string, customImagesDir + game.game_id + ".png");
    let image = await fs.readBinaryFile(customImagesDir + game.game_id + ".png");
    let blob = new Blob([image], { type: "image/png" });
    let url = URL.createObjectURL(blob);
    if (gameImage === null) throw new Error("Couldn't find game image element");
    gameImage.setAttribute("src", url);
    emit("refresh-page");
    window.location.reload();
}

async function resetImage() {
    if (!(await fs.exists(customImagesDir + game.game_id + ".png"))) return;
    fs.removeFile(APPDATA_PATH + "custom-img/" + game.game_id + ".png");
    gameImage!.setAttribute("src", "/assets/game-images/" + game.img);
    emit("refresh-page");
    window.location.reload();
}

document.getElementById("image-setting-change")?.addEventListener("click", setNewImage);
document.getElementById("image-setting-reset")?.addEventListener("click", resetImage);
let showText = document.getElementById("show-text") as HTMLInputElement;

showText.checked = gameData.showText;

showText?.addEventListener("click", async () => {
    let gameData = localStorage.getItem(game.game_id);
    if (gameData === null) throw new Error("Couldn't find game data in local storage");
    let gameDataJSON = JSON.parse(gameData);
    gameDataJSON.showText = showText.checked;
    let payload = {
        gameID: game.game_id,
        updatedData: JSON.stringify(gameDataJSON),
    };
    await emit("update-game", payload);
    await emit("refresh-page");
});

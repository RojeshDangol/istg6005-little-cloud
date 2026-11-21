# istg6005-little-cloud
Week 5 Homework - Devcontainer Basics

# Python and Mount Test

I ran `python --version` inside the Ubuntu container and confirmed that Python was installed. Python 3.14.4

I then ran `touch /data/mount-check.txt` and checked my project folder on my Mac above README.md.

The file `mount-check.txt` appeared next to `README.md`, confirming that the `/data` bind mount was working correctly.

# Versions After Modifying with Codex

Python 3.14.4
Node: v26.13.1
Codex: codex-cli 0.171.0

# Project

-I've decided to make an app in html to create songs. My targeted audiences are people who love music mostly young people who can play around it to have fun.

-I asked codex to make me the app and it generated a tab with instruments to make looping sounds.

-I asked it to make a tab that can store different pattern, and below that make a window where the patterns can be put together to create a song.

-It kind of worked but then I asked it to make the patterns draggable.

-Then I added timeline, playback display also changed the display of the pattern's box.

-It wasn't playing the track seamlessly which I asked codex to fix.

-Then I adjusted various minor changes like colors, names, positioning etc to make it look better.

-I added an option to download the song, also added an option to create a project and save and display projects.

-Moved buttons and added button to create new patterns

-Added an option to save project and songs locally and also open project that are saved locally.

-I added more instruments.

-Added an option to record voice, but it didn't fit well in the pattern's box and it was snapping in weird positions, and fixed those.

-Added a slider to adjust volume of the recordings.

-Adjusted the displays and texts.

-Finally, asked Codex to explain in detail on how to run this file and updated the README.md file.

# How to run this app?

Rojesh's Music Studio runs in your browser. You'll need Python 3 to start a local web server. The app's HTML, CSS, and JavaScript are all in project/index.html, so there's nothing to build or install for the app itself.

## 1. Download the app

1. Open the GitHub repository.
2. Click Code, then Download ZIP. GitHub's download guide
3. Unzip the download and open the extracted folder. This is the folder containing README.md and the project subfolder. Depending on the branch, the folder name may end in -main.
4. Open Terminal, PowerShell, or the VS Code integrated terminal in the extracted folder. If the terminal opens elsewhere, use cd with the path to the extracted folder.

If you already have Git, you can clone the repository instead of downloading a ZIP.

git clone https://github.com/RojeshDangol/istg6005-little-cloud.git
cd istg6005-little-cloud

## 2. Start the local server

Run the command for your system from the folder containing README.md.

macOS or Linux

python3 -m http.server 8000 --bind 127.0.0.1 --directory project

Windows PowerShell

py -3 -m http.server 8000 --bind 127.0.0.1 --directory project

If the command isn't found, install Python 3 and reopen the terminal. On Windows, you can also try python in place of py -3 if python --version shows Python 3.

Keep the terminal open and visit http://localhost:8000/ in your browser. Press Ctrl+C in the terminal when you're done to stop the server.

## 3. Make your first beat

1. Click Load demo, then Play to hear the sample loop.
2. Click New pattern to start with an empty grid. Click cells to add or remove hits, and open Roll on a melodic track to write notes or chords.
3. Enter a name and click Save pattern. Drag the saved pattern into the Song timeline, or click Add to song. Add more patterns and press Play song to hear the arrangement.
4. To add your voice, click Start recording, allow microphone access, and click Stop recording when you're done. Drag the take into the voice lane below the patterns. Use Voice volume to adjust it in the mix.

## Save and reopen your work

- Projects → Save project saves an editable .json file. Use Projects → Open project file to reopen it later.
- Download WAV in the Song timeline exports the arrangement as an audio file you can play or share.
- Use Projects → Choose save folder if your browser offers a folder picker. Otherwise, files use your browser's download settings.

## Troubleshooting

- The browser can't connect. Check that the terminal is still running the server. If port 8000 is already in use, change it to 8001 in the command and open http://localhost:8001/. Browser-saved drafts and the Projects sidebar are stored separately for each port. You can move a project between ports by saving and reopening its .json file.
- You see a directory listing or a 404. Run the server from the folder containing README.md and keep --directory project in the command.
- You hear nothing. Click Load demo and Play, then check that the browser tab and device audio are unmuted.
- Recording won't start. Open the app at http://localhost:8000/ and allow microphone access in the browser's site settings. If you're using another port, open the app at that localhost address.

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

# Hosted it using Github pages

https://rojeshdangol.github.io/istg6005-little-cloud/project/

# How to run this app locally?

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


-------------------------------------------------------------------------------------------------------------------------------------------


# Week 6 - AI Flight Price Tracker

## Project Overview

This project uses n8n and AI to help travelers find affordable flights and decide when to buy tickets. I created this workflow because checking flight prices manually every day takes time.

The workflow automatically retrieves flight prices, analyzes available options, compares prices with the user's budget, and monitors historical price changes. It also validates user inputs and AI-generated results to reduce errors.

## Tools Used

- n8n version: 2.35.7
- Node.js version: 22
- AI Provider: OpenAI
- AI Model: gpt-5-mini
- Flight Data: SerpApi (Google Flights)
- Data Storage: n8n Data Tables
- Programming Language: JavaScript
- Environment: Docker Dev Container
- Development Tool: Visual Studio Code
- Version Control: GitHub

## Required API Credentials

To run this workflow, the instructor must recreate the following credentials in n8n:

### OpenAI

- Credential type: OpenAI API
- Credential name: OpenAI account
- Model: gpt-5-mini
- Requires a valid OpenAI API key.

### SerpApi

- Credential type: Query Auth
- Parameter name: api_key
- Requires a valid SerpApi API key.

API keys are stored securely in n8n credentials and are not included in the exported workflow.

After importing the workflow, reconnect both credentials to their corresponding nodes.

## Input

The workflow accepts the following input fields through the Edit Fields node:

- Flight request
- Departure airport: Pittsburgh (PIT)
- Destination airport: Kathmandu (KTM)
- Departure date: February 5, 2027
- Return date: March 20, 2027
- Budget: $2,000

These values can be changed to search for different flights.

## How the Workflow Works

1. Starts manually or automatically every day at 9 AM.
2. Collects flight details from the Edit Fields node.
3. Validates the input using an IF node.
4. Sends invalid or incomplete requests to Needs Review.
5. Retrieves flight prices using SerpApi.
6. Uses OpenAI to analyze available flights.
7. Converts the AI response into structured JSON using the Structured Output Parser.
8. Uses JavaScript to validate AI-generated prices against the original flight data.
9. Compares flight prices with the user's budget.
10. Uses a second IF node to determine whether the AI output is valid.
11. Saves validated flight prices in a data table.
12. Retrieves historical flight prices.
13. Calculates average, lowest, and highest recorded prices.
14. Identifies price trends and provides buying recommendations.

## Input Validation

The workflow checks whether:

- The flight request is provided.
- Airport codes contain three uppercase letters.
- Departure and destination airports are different.
- Travel dates are provided.
- The return date is after the departure date.
- The budget is greater than zero.

If the input is invalid, the workflow sends the request to the Needs Review node without calling the flight API or OpenAI.

## AI Output Validation

The Structured Output Parser converts the AI response into organized JSON fields.

JavaScript is then used to check whether:

- The AI response has a successful status.
- The cheapest price matches the original flight data.
- The recommended price exists in the original flight data.
- The budget matches the user's input.
- The returned flight options contain valid prices.

Only results that pass validation are saved in the data table.

Invalid AI results are sent to the AI Needs Review node. AI processing and formatting errors are directed to a separate AI Processing Error node.

## Output

The workflow provides:

- Cheapest available flight
- Up to five affordable flight options
- Airline information
- Flight duration and layovers
- Budget comparison
- Potential savings
- AI-generated flight recommendations
- Historical price comparison
- Price trends
- Buying recommendations
- Needs Review messages for invalid inputs or results

## Example Output

During a successful workflow execution, the following results were generated:

| Information | Result |
|---|---|
| Departure airport | PIT |
| Destination airport | KTM |
| Budget | $2,000 |
| Cheapest flight | $1,348 |
| AI recommended flight | $1,549 |
| Maximum potential savings | $652 |
| Savings on recommended flight | $451 |
| Historical records | 3 |
| Previous price | $1,346 |
| Average price | $1,346.67 |
| Lowest recorded price | $1,346 |
| Highest recorded price | $1,348 |
| Price change | $2 |
| Percentage change | 0.15% |
| Price trend | RISING |
| Recommendation | MONITOR PRICE |

The AI recommended the $1,549 flight because it offered a better balance between price, travel duration, and layovers.

## Testing

Three different input cases were used to evaluate the workflow.

| Test | Input | Expected Result |
|---|---|---|
| Normal | Valid flight details and budget | Complete flight and historical price analysis |
| Incomplete | Missing departure date | Needs Review |
| Contradictory | Return date before departure date | Needs Review |

The normal request successfully generated flight recommendations and historical price analysis.

Detailed test results are documented in `evidence/test-results.md`.

## Workflow Improvements

During testing, I discovered that the original Boolean validation condition did not consistently send requests to the correct branch.

I replaced the Boolean condition with a string-based validation condition that returns either VALID or INVALID. I also used a regular expression to handle possible extra spaces or line breaks.

The revised condition successfully accepted valid input during retesting. This improvement was made to prevent invalid requests from reaching the flight API and to improve workflow reliability.

I also added structured AI output, AI result validation, and separate error-handling branches.

## Automation

The workflow is configured to run every day at 9 AM using the America/New_York timezone. The n8n container must remain running for scheduled executions.

Each successful execution stores flight price information, allowing the workflow to build historical data over time.

## How to Run

1. Open the repository in VS Code.
2. Start the dev container.
3. Open the terminal and install the required dependencies:

   ```
   cd /data/automation
   npm ci
   ```

4. Start n8n:

   ```
   N8N_USER_FOLDER=/data/.runtime/n8n N8N_LISTEN_ADDRESS=127.0.0.1 npx n8n start
   ```

5. Open http://localhost:5678.
6. Import `workflows/ai-flight-price-tracker.json`.
7. Configure OpenAI and SerpApi credentials.
8. Create the required historical price data table and select it in the workflow.
9. Enter the flight details in the Edit Fields node.
10. Execute the workflow manually or publish it for daily automation.

## Flight Tracker Dashboard on GitHub Pages

The dashboard sends public searches to a separate Railway gateway. The gateway validates airport codes, calendar dates, and USD budget before calling n8n. It allows 5 searches per rolling 10 minutes and 20 per rolling 24 hours across all visitors by default. Each forwarded attempt counts, even if n8n fails. The quota is stored on the gateway's Railway volume and applies only to public searches.

### Connect the public n8n workflow

1. In the existing Railway n8n instance, import `workflows/flight-price-tracker-public-search.json` as a **new workflow**. Your scheduled workflow can continue using its current configuration.
2. Select your existing OpenAI and SerpApi credentials and the existing `flight_price_history` table in both data table nodes.
3. On **Flight Tracker Webhook**, create and select a **Header Auth** credential. Use `X-Flight-Tracker-Token` as the header name and a long random value as the token. Publish this new workflow and copy its production URL.

### Deploy the Railway gateway

Add a **separate Railway service** from this repository in the same environment as n8n. Use the repository root as the build context. Attach a volume such as `/rate-limit` to the gateway and set its healthcheck path to `/health`.

| Railway gateway variable | Value |
| --- | --- |
| `RAILWAY_DOCKERFILE_PATH` | `/flight-tracker/Dockerfile` |
| `FLIGHT_TRACKER_ORIGIN` | The Pages origin, such as `https://rojeshdangol.github.io`, without the repository path or trailing slash |
| `N8N_WEBHOOK_URL` | The n8n production URL ending in `/webhook/flight-price-tracker`. Use the private service hostname and actual n8n listening port when available, for example `http://n8n.railway.internal:5678/webhook/flight-price-tracker` |
| `N8N_WEBHOOK_TOKEN` | The matching Header Auth token |
| `SEARCH_LIMIT_PER_10_MINUTES` | Optional shared limit. Defaults to `5` |
| `SEARCH_LIMIT_PER_DAY` | Optional shared limit. Defaults to `20` |

Railway supplies `RAILWAY_VOLUME_MOUNT_PATH` and `PORT`. Generate a public domain for the gateway. Keep the OpenAI and SerpApi credentials in n8n and the webhook token in n8n and the gateway. Only the gateway URL goes to GitHub.

### Publish the frontend

1. In GitHub, under **Settings → Secrets and variables → Actions → Variables**, set `FLIGHT_TRACKER_API_URL` to the gateway's HTTPS URL ending in `/api/search`.
2. Under **Settings → Pages**, choose **GitHub Actions** as the source.
3. Push the changes to `main` or run **Deploy flight tracker to GitHub Pages** from the Actions tab. The deployment summary links to the site. Rerun the deployment after changing the gateway URL.

**View sample results** works before the gateway is configured.

### Run locally

Run `node flight-tracker/server.mjs` and open [http://localhost:8080](http://localhost:8080). Set `N8N_WEBHOOK_TOKEN` in your shell for live searches. The local gateway defaults to the n8n production webhook on port 5678. For a test run, set `N8N_WEBHOOK_URL` to `http://127.0.0.1:5678/webhook-test/flight-price-tracker` and select **Listen for test event** in n8n before submitting.

## Security

API credentials are managed through n8n credentials. API keys are not hardcoded into the workflow.

Runtime data, environment files, local databases, and installed dependencies are excluded from Git using `.gitignore`.

## AI Assistance

I used AI assistance to help design the workflow, create prompts, write JavaScript code, configure validation, and troubleshoot errors.

I personally configured the nodes, connected the APIs, executed the workflow, reviewed the results, and tested the validation conditions.

AI helped me develop the workflow, but I was responsible for checking its functionality and making improvements.

## Limitations

- The workflow needs more historical data to identify meaningful price trends.
- Flight prices and availability can change at any time.
- The workflow depends on external APIs and internet access.
- OpenAI and SerpApi may have usage costs and limits.
- AI recommendations may contain errors.
- Airport code validation checks the format but does not confirm that the airport exists.
- Flight details must currently be entered into separate input fields.
- The workflow identifies historical price trends but does not reliably predict future flight prices.

## Future Improvements

- Email notifications when prices decrease.
- Support for multiple destinations.
- Flexible travel dates.
- Historical price charts.
- Automatic extraction of travel details from natural-language requests.
- Machine learning for flight price prediction.
- Improved error handling.
- A user-friendly interface for entering flight requests.

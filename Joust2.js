// Step 3: Debugging - List all iframes and select the correct one
const frames = page.frames();
console.log("Listing all iframes:");
frames.forEach((frame, index) => {
    console.log(`Frame[${index}]: ${frame.url()}`);
});

// Switch to the correct iframe that contains the game (likely the one with "main_src.php")
const iframe = frames.find(frame => frame.url().includes('main_src.php'));
if (!iframe) {
    console.error("Could not find the correct iframe containing the game.");
    return;
}
console.log("Switched to main iframe:", iframe.url());

// Step 4: Click on the correct badge and then the blue 'Joust' button
try {
    await iframe.locator('xpath=//*[@id="mod_maparea"]/a[1]').click();  // Correct badge
    console.log("Clicked on the correct badge.");

    await iframe.locator('xpath=//*[@id="joustingOverview"]/div[3]/a').click();  // Blue Joust button
    console.log("Clicked on the blue Joust button.");
} catch (error) {
    console.error("Error clicking badge or Joust button:", error);
}

// Function to find and click the champion with damage value of 30
async function findAndClickJoust() {
    try {
        // Wait for the damage stats to load and get the values
        const damageFirst = await iframe.locator('xpath=//*[@id="joustingMatchmaking"]/div[1]/div[1]/div/div/div[2]/div[2]').innerText();
        const damageSecond = await iframe.locator('xpath=//*[@id="joustingMatchmaking"]/div[1]/div[2]/div/div/div[2]/div[2]').innerText();
        const damageThird = await iframe.locator('xpath=//*[@id="joustingMatchmaking"]/div[1]/div[3]/div/div/div[2]/div[2]').innerText();

        // Convert the damage values to floats
        const damageValues = [
            parseFloat(damageFirst.trim()),
            parseFloat(damageSecond.trim()),
            parseFloat(damageThird.trim())
        ];

        // XPaths for the Joust buttons
        const joustButtons = [
            iframe.locator('xpath=//*[@id="joustingMatchmaking"]/div[1]/div[1]/a'),
            iframe.locator('xpath=//*[@id="joustingMatchmaking"]/div[1]/div[2]/a'),
            iframe.locator('xpath=//*[@id="joustingMatchmaking"]/div[1]/div[3]/a')
        ];

        // Check each champion's damage and click the corresponding Joust button if damage is 30
        for (let i = 0; i < damageValues.length; i++) {
            if (damageValues[i] === 30.0) {
                await joustButtons[i].click();
                console.log(`Clicked on the Joust button for champion with damage ${damageValues[i]}.`);

                // Wait for and click the blue 'Ok' button after the joust
                await iframe.locator('xpath=//*[@id="joustingReportBtn"]').click();
                console.log("Clicked on the blue 'Ok' button.");

                // Wait for 10 seconds after clicking the 'Ok' button
                await page.waitForTimeout(10000);
                return true;
            }
        }
        return false;  // Return false if no champion had damage of 30
    } catch (error) {
        console.error("Error finding or clicking Joust button:", error);
        return false;
    }
}

// Repeat the process until a champion with damage 30 is found
while (true) {
    if (await findAndClickJoust()) {
        try {
            // After clicking the 'Ok' button, click the blue 'Joust' button to restart the loop
            await iframe.locator('xpath=//*[@id="joustingOverview"]/div[3]/a').click();
            console.log("Clicked the blue 'Joust' button to restart.");
            await page.waitForTimeout(10000);  // Wait 10 seconds before repeating the process
        } catch (error) {
            console.error("Error clicking blue 'Joust' button:", error);
        }
        continue;
    }

    // If no champion with damage 30 was found, click "Match again" to refresh the stats
    try {
        await iframe.locator('xpath=//*[@id="joustingMatchmaking"]/div[2]/a').click();
        console.log("Clicked on Match again button.");
        await page.waitForTimeout(5000);  // Wait for the new stats to load
    } catch (error) {
        console.error("Error clicking Match again button:", error);
        break;
    }
}

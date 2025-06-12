# Website Usage Statistics Visualization

This tool generates a heatmap visualization of your website usage statistics from the Screen Time Tracker app.

## Setup

1. Install Python (3.7 or higher) if you don't have it already
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## How to Use

### Step 1: Export your website usage data
1. Go to the Website Blocker page in the Screen Time Tracker app
2. Click the "Export Usage Data for Analysis" button at the bottom of the page
3. This will download a file called `website_data.json`
4. Move this file to the same folder as the `usage_stats.py` script

### Step 2: Generate the heatmap
1. Open a command prompt or terminal
2. Navigate to the folder containing the script
3. Run the script:
   ```
   python usage_stats.py
   ```
4. The script will generate a heatmap image called `website_usage_heatmap.png`
5. The heatmap will also be displayed on screen if you're running the script in an environment with a GUI

## Understanding the Visualization

The heatmap shows:
- Websites sorted by usage time (most used at the top)
- Color intensity representing the percentage of your time limit used
- Text annotations showing actual minutes used vs. your set limit

This visualization helps you identify which websites are consuming most of your time relative to their limits.

## Troubleshooting

If you encounter any issues:
1. Make sure the `website_data.json` file is in the same folder as the script
2. Verify that all required packages are installed
3. Check that the JSON file has the correct format (it should contain an array of objects with url, timeUsed, timeLimit, and lastReset properties)
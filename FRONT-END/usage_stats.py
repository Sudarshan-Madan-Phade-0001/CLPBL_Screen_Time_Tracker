import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
import sys

def main():
    print("Generating website usage heatmap...")
    
    if len(sys.argv) > 1:
        data_path = sys.argv[1]
    else:
        data_path = os.path.join(os.path.dirname(__file__), 'website_data.json')
    
    print(f"Reading data from: {data_path}")
    
    try:
        with open(data_path, 'r') as f:
            data = json.load(f)
        
        if not data:
            print("No website data found in the file.")
            return
            
        print(f"Found data for {len(data)} websites.")
        
        create_heatmap(data)
        
    except FileNotFoundError:
        print(f"Error: File {data_path} not found.")
        print("Please make sure your exported JSON file is in the correct location.")
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in the data file.")
    except Exception as e:
        print(f"Error: {e}")

def create_heatmap(data):
    websites = [site['url'] for site in data]
    usage_times = [site['timeUsed'] for site in data]
    limits = [site['timeLimit'] for site in data]
    
    usage_percentage = [min(100, (used / limit) * 100) if limit > 0 else 0 
                        for used, limit in zip(usage_times, limits)]
    
    df = pd.DataFrame({
        'Website': websites,
        'Usage (min)': usage_times,
        'Limit (min)': limits,
        'Usage %': usage_percentage
    })
    
    df = df.sort_values('Usage (min)', ascending=False)
    
    plt.figure(figsize=(12, 8))
    
    heatmap_data = df.set_index('Website')[['Usage %']]
    sns.heatmap(heatmap_data, annot=False, cmap="YlOrRd", cbar_kws={'label': 'Usage %'})
    
    for i, website in enumerate(df['Website']):
        plt.text(0.5, i + 0.5, f"{df.iloc[i]['Usage (min)']}/{df.iloc[i]['Limit (min)']} min", 
                 ha='center', va='center', color='black', fontweight='bold')
    
    plt.title('Website Usage Statistics', fontsize=16)
    plt.tight_layout()
    
    output_path = os.path.join(os.path.dirname(__file__), 'website_usage_heatmap.png')
    plt.savefig(output_path)
    print(f"Heatmap saved to: {output_path}")
    
    plt.show()

if __name__ == "__main__":
    main()
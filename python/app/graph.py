import matplotlib.pyplot as plt 
from PIL import Image
import io

def fig2img(fig):
    print("Converting matplotlib plot to image")
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches='tight', dpi=150, facecolor='black', edgecolor='none')
    buf.seek(0)
    img = Image.open(buf)
    plt.close(fig)  # Close the figure to free memory
    return img

def plot_graph(x, y, title):
    print("Plotting graph..")
    print("Setting canvas size..")
    
    # Create figure with dark theme (matches NFT aesthetic)
    fig, ax = plt.subplots(figsize=(12, 6), facecolor='black')
    ax.set_facecolor('black')
    
    print("Plotting and designing the graph..")
    
    # Enhanced styling for NFT visualization
    ax.set_title(title, color='#10b981', fontsize=16, fontweight='bold', pad=20)
    ax.set_xlabel('Time Period (Days)', color='#9ca3af', fontsize=12)
    ax.set_ylabel('NDVI Value', color='#9ca3af', fontsize=12)
    
    # Plot the line with enhanced styling
    ax.plot(x, y, marker='o', linestyle='-', color='#10b981', linewidth=3, 
            markersize=10, markerfacecolor='#10b981', markeredgecolor='#065f46', markeredgewidth=2)
    
    # Fill area under the curve for better visualization
    ax.fill_between(x, y, alpha=0.2, color='#10b981')
    
    # Grid styling
    ax.grid(True, alpha=0.2, color='#374151', linestyle='--', linewidth=0.5)
    
    # Axis styling
    ax.tick_params(colors='#9ca3af', labelsize=10)
    ax.spines['bottom'].set_color('#374151')
    ax.spines['top'].set_color('#374151')
    ax.spines['right'].set_color('#374151')
    ax.spines['left'].set_color('#374151')
    
    # Add value annotations
    if len(x) > 0 and len(y) > 0:
        # Annotate the final NDVI value
        final_x = x[-1]
        final_y = y[-1]
        ax.annotate(f'NDVI: {final_y:.4f}', 
                   xy=(final_x, final_y), 
                   xytext=(10, 10), 
                   textcoords='offset points',
                   fontsize=11,
                   color='#10b981',
                   bbox=dict(boxstyle='round,pad=0.5', facecolor='#065f46', alpha=0.7, edgecolor='#10b981'),
                   arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=0', color='#10b981'))
    
    # Set axis limits with some padding
    if len(x) > 0 and len(y) > 0:
        ax.set_xlim(min(x) - 1, max(x) + 1)
        y_min = min(y) if min(y) >= 0 else 0
        y_max = max(y) * 1.1 if max(y) > 0 else 0.1
        ax.set_ylim(y_min, y_max)
    
    print("Graph styling completed")
    fig = plt.gcf()
    img = fig2img(fig)
    print("Graph image generated successfully")
    return {"success": True, "image": img}


import subprocess
import os

def create_robot_voice():
    try:
        # First, let's see what voices are available
        print("Checking available voices...")
        
        # Create audio file in AIFF format (macOS native)
        command = 'say -v Zarvox -r 180 -o ready.aiff "Ready"'
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("Done! Robot voice 'ready.aiff' created!")
            
            # Try to convert to WAV using ffmpeg if available
            try:
                convert_cmd = 'ffmpeg -i ready.aiff ready.wav -y'
                subprocess.run(convert_cmd, shell=True, check=True, capture_output=True)
                os.remove('ready.aiff')  # Clean up
                print("Converted to WAV format!")
            except:
                print("WAV conversion failed, but AIFF file works fine!")
                
        else:
            print(f"Error: {result.stderr}")
            # Fallback - just play the sound instead of saving
            print("Trying direct playback...")
            subprocess.run('say -v Zarvox -r 180 "Ready"', shell=True)
            
    except Exception as e:
        print(f"Error: {e}")
        # Simple fallback
        print("Using simple approach...")
        subprocess.run('say "Ready"', shell=True)

# Even simpler version - just play the robot voice
def play_robot_voice():
    print("Playing robot voice...")
    subprocess.run('say -v Zarvox -r 180 "Ready"', shell=True)
    print("Done!")

# Try the file creation first
create_robot_voice()

# If you just want to hear it without saving:
# play_robot_voice()
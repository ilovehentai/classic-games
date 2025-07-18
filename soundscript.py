import subprocess
import os
import argparse

def create_robot_voice(text="Ready", filename=None):
    """
    Create a robot voice audio file with the given text.
    
    Args:
        text: The text to convert to speech
        filename: Output filename (without extension). If None, uses the text as filename.
    """
    if filename is None:
        # Create filename from text (remove spaces and special chars)
        filename = ''.join(c for c in text.lower() if c.isalnum() or c in '-_')
    
    try:
        # First, let's see what voices are available
        print(f"Creating robot voice for: '{text}'")
        
        # Create audio file in AIFF format (macOS native)
        aiff_filename = f"{filename}.aiff"
        command = f'say -v Zarvox -r 180 -o {aiff_filename} "{text}"'
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"Done! Robot voice '{aiff_filename}' created!")
            
            # Try to convert to WAV using ffmpeg if available
            try:
                wav_filename = f"{filename}.wav"
                convert_cmd = f'ffmpeg -i {aiff_filename} {wav_filename} -y'
                subprocess.run(convert_cmd, shell=True, check=True, capture_output=True)
                os.remove(aiff_filename)  # Clean up
                print(f"Converted to WAV format: {wav_filename}")
            except:
                print("WAV conversion failed, but AIFF file works fine!")
                
        else:
            print(f"Error: {result.stderr}")
            # Fallback - just play the sound instead of saving
            print("Trying direct playback...")
            subprocess.run(f'say -v Zarvox -r 180 "{text}"', shell=True)
            
    except Exception as e:
        print(f"Error: {e}")
        # Simple fallback
        print("Using simple approach...")
        subprocess.run(f'say "{text}"', shell=True)

# Even simpler version - just play the robot voice
def play_robot_voice(text="Ready"):
    print(f"Playing robot voice: '{text}'")
    subprocess.run(f'say -v Zarvox -r 180 "{text}"', shell=True)
    print("Done!")

def main():
    parser = argparse.ArgumentParser(description='Generate robot voice audio files')
    parser.add_argument('text', nargs='?', default='Ready', 
                        help='Text to convert to speech (default: "Ready")')
    parser.add_argument('-f', '--filename', help='Output filename (without extension)')
    parser.add_argument('-p', '--play', action='store_true', 
                        help='Just play the sound without saving to file')
    
    args = parser.parse_args()
    
    if args.play:
        play_robot_voice(args.text)
    else:
        create_robot_voice(args.text, args.filename)

if __name__ == "__main__":
    main()
# Genie

![Demo](demo.gif)

Genie is an automated video editing tool that transforms natural language prompts into professionally edited videos. It leverages the [`text_to_action`](https://github.com/sri0606/text_to_action) library to interpret text-based instructions and apply the corresponding edits seamlessly. Genie simplifies video editing by automating complex tasks, making it accessible to users with little to no editing experience.

## Features

- **Natural Language Editing:** Use simple text prompts to perform actions like trimming, adding transitions, overlays, captions, and more.
- **Action Detection:** Automatically detects editing actions from text using advanced NLP techniques.
- **Customizable Outputs:** Fine-tune generated videos by providing detailed instructions.
- **Cross-Platform:** Runs on multiple platforms, including Windows, macOS, and Linux.
- **Seamless Workflow Integration:** Works with various video formats and integrates easily into existing workflows.

## Project Structure

- **Frontend:** The frontend is built using ElectronJS and is located in the `GenieApp` folder. It provides an intuitive user interface for creating and managing video edits.
- **Backend:** The backend is implemented in Python and resides in the `GenieAPI` folder. It handles the processing of text prompts and video editing actions.

## Getting Started

### Prerequisites

- Python 3.8 or higher
- [`text_to_action`](https://github.com/sri0606/text_to_action) library
- ffmpeg (for video processing)
- Node.js (for running the ElectronJS frontend)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/genie.git
   cd genie
   ```

2. Install the required dependencies for the backend:
   ```bash
   cd GenieAPI
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the `GenieAPI` folder and add your API key for the LLM being used. The key should match the `LLM_client` specified in `api.py`. For more instructions, refer to the [`text_to_action`](https://github.com/sri0606/text_to_action) page.

4. Ensure `ffmpeg` is installed and available in your system's PATH.

5. Install dependencies for the frontend:
   ```bash
   cd ../GenieApp
   npm install
   ```

### Usage

#### Backend

1. Start the backend API:
   ```bash
   cd GenieAPI
   python api.py
   ```

#### Frontend

2. Launch the ElectronJS application:
   ```bash
   cd GenieApp
   npm run dev
   ```

3. Provide a text prompt describing the desired video edits. For example:
   ```text
   Trim the video to the first 30 seconds and add a fade-in effect.
   ```

4. Interact with the application to generate and save the edited video.

## Contributing

Genie is an open-source project, and contributions are welcome!




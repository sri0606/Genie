from fastapi import FastAPI
from typing import Any,Optional, Dict
from pydantic import BaseModel
import json
import os
from text_to_action import TextToAction, LLMClient, create_actions_embeddings
from dotenv import load_dotenv
load_dotenv()


class FunctionsRequest(BaseModel):
    text: str
    top_k: Optional[int]=5
    threshold: Optional[float] = 0.45

class ArgumentsRequest(BaseModel):
    text: str
    action_name: str
    args: Dict[str,Dict[str,Any]]

app = FastAPI()

llm_client = LLMClient(model="groq/llama3-70b-8192")
current_directory = os.path.dirname(os.path.abspath(__file__))
autove_actions_folder = os.path.join(current_directory,"autove")

dispatcher = TextToAction(actions_folder = autove_actions_folder, llm_client=llm_client,
                            verbose_output=True,application_context="Video Editing", filter_input=True)

@app.post("/extract_actions")
async def extract_actions(request:FunctionsRequest):
    result =  dispatcher.extract_actions(query_text=request.text,
                                    top_k=request.top_k,threshold=request.threshold)

    return json.dumps(result)

@app.post("/extract_arguments")
async def extract_arguments(request:ArgumentsRequest):
    result = dispatcher.extract_parameters(query_text=request.text, action_name=request.action_name, args = request.args)

    return json.dumps(result)
         
@app.post("/extract_actions_with_args")
async def extract_actions_with_args(request:FunctionsRequest):
    result =  dispatcher.extract_actions_with_args(query_text=request.text,
                                    top_k=request.top_k,threshold=request.threshold)

    return json.dumps(result)

@app.post("/run")
async def run( request:FunctionsRequest):
    result =  dispatcher.run(query_text=request.text,
                                    top_k=request.top_k,threshold=request.threshold)

    return json.dumps(result)

def update_embeddings():
    current_directory = os.path.dirname(os.path.abspath(__file__))
    descriptions_filepath = os.path.join(current_directory, "autove", "descriptions.json")
    save_to = os.path.join(current_directory, "autove", "embeddings.h5")

    create_actions_embeddings(descriptions_filepath, save_to=save_to,validate_data=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

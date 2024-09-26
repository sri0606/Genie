from fastapi import FastAPI,Body
from typing import Any,Optional
from pydantic import BaseModel
import json
from text_to_action import ActionDispatcher
from dotenv import load_dotenv
from functions_metadata import FUNCTION_ARG_TYPES
load_dotenv()

class FunctionsRequest(BaseModel):
    text: str
    top_k: Optional[int]=5
    threshold: Optional[float] = 0.45

class ArgumentsRequest(BaseModel):
    text: str
    functions_args_dict:Any = Body(...)

app = FastAPI()

dispatcher = ActionDispatcher(action_embedding_filename="autove.h5",actions_filepath=None,
                                use_llm_extract_parameters=True,verbose_output=True)


@app.post("/extract_functions")
async def extract_functions(request:FunctionsRequest):
    functions_list =  dispatcher.extract_functions(query_text=request.text,
                                    top_k=request.top_k,threshold=request.threshold)
    functions_args = {}
    for function in functions_list:
        if function in FUNCTION_ARG_TYPES:
            functions_args[function] = FUNCTION_ARG_TYPES[function]
    return json.dumps(functions_args)

@app.post("/extract_arguments")
async def extract_arguments(request:ArgumentsRequest):

    if isinstance(request.functions_args_dict, str):
        try:
            functions_args_dict = json.loads(request.functions_args_dict)
        except json.JSONDecodeError:
            return {"error": "Invalid JSON for functions_args_dict"}
    else:
        functions_args_dict = request.functions_args_dict
    
    if isinstance(functions_args_dict, dict):
        return dispatcher.extract_parameters(query_text=request.text,
                                         functions_args_description=functions_args_dict
                                    )
    else:
        return json.dumps(dispatcher.extract_parameters(query_text=request.text,
                                            functions_args_description=functions_args_dict
                                        ))
         
@app.post("/extract")
async def extract(request:FunctionsRequest):
    functions_list =  dispatcher.extract_functions(query_text=request.text,
                                    top_k=request.top_k,threshold=request.threshold)
    extracted_functions_args = []
    for function in functions_list:
        if function in FUNCTION_ARG_TYPES:
            # Extract parameters
            extracted_params = dispatcher.extract_parameters(
                query_text=request.text,
                functions_args_description={function: FUNCTION_ARG_TYPES[function]}
            )
            
            # Add missing parameters with default value (None, 'Not found', etc.)
            for param, param_type in FUNCTION_ARG_TYPES[function].items():
                if param not in extracted_params[function]:
                    extracted_params[function][param] = None  # or 'Not found' or any default value you prefer
            
            extracted_functions_args.append(extracted_params)

    return json.dumps(extracted_functions_args)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
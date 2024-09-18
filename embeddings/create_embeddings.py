from text_to_action.create_actions import create_actions_embeddings
from text_to_action.types import ModelSource
import time
from embeddings.training_embeddings import functions_description


if __name__ == "__main__":
    
    start_time = time.time()    
    
    # you can use SBERT or other huggingface models to create embeddings
    create_actions_embeddings(functions_description, save_filename="autove.h5",
                                embedding_model="all-MiniLM-L6-v2",model_source=ModelSource.SBERT)
    print("Time taken to add vectors: ",time.time()-start_time)
    
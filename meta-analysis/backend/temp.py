import os
import google.generativeai as genai

genai.configure(api_key="AIzaSyCOmwXnskUW7wqfA5WZptgdWYAojSuRUL0")

# Create the model
generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
  model_name="gemini-2.0-flash-exp",
  generation_config=generation_config,
)

chat_session = model.start_chat(
  history=[
  ]
)

response = chat_session.send_message("create a single abstract for the following prompt: 'The impact of climate change on the economy' as an output in .JSON form with key: 'abstract'")

print(response.text)
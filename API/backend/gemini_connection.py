import os
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
# Importar o novo módulo de banco de dados
from . import patient_db # Usando import relativo

# Configuração da API Gemini    
try:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("A variável de ambiente GEMINI_API_KEY não foi encontrada.")
    genai.configure(api_key=api_key)
except ValueError as e:
    print(f"Erro de configuração da API Gemini: {e}")
    raise

# Carregar Instrução do Sistema 
try:
    system_instruction_file = os.path.join(os.path.dirname(__file__), 'Co-Pilot_medico.txt') # Ajuste de caminho
    if not os.path.exists(system_instruction_file):
         raise FileNotFoundError(f"Arquivo de instrução do sistema não encontrado em: {system_instruction_file}")
    system_instruction_content = open(system_instruction_file, encoding='utf-8').read()
except FileNotFoundError as e:
     print(f"Erro: {e}")
     raise

# Configurações do Modelo 
MODEL_NAME = "gemini-1.5-flash-latest" # Movido para constante
SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

# REMOVIDO: chat = model.start_chat(history=[]) # Não teremos mais um chat global único

def send_message(patient_id: str, message_text: str):
    """
    Envia uma mensagem para uma sessão de chat Gemini específica do paciente e retorna a resposta.
    O histórico é carregado do patient_db e formatado para a API Gemini (removendo campos extras).
    """
    try:
        # Carregar histórico do paciente do nosso banco de dados JSON
        history_from_db = patient_db.get_patient_chat_history(patient_id)

        # Formatar o histórico para a API Gemini.
        # A API Gemini espera uma lista de objetos Content, cada um com 'role' e 'parts'.
        gemini_formatted_history = []
        if history_from_db: # Processa apenas se houver histórico
            for message_from_db in history_from_db:
                # Verifica se os campos essenciais ('role' e 'parts') existem na mensagem do DB
                if "role" in message_from_db and "parts" in message_from_db:
                    gemini_formatted_history.append({
                        "role": message_from_db["role"],
                        "parts": message_from_db["parts"]
                        # O campo 'timestamp' e quaisquer outros campos extras são omitidos 
                    })
                else:
                    print(f"Aviso: Mensagem mal formatada no histórico do paciente {patient_id} ignorada: {message_from_db}")
        

        # Instanciar o modelo com a instrução do sistema
        model = genai.GenerativeModel(
            model_name=MODEL_NAME, #
            system_instruction=system_instruction_content, #
            safety_settings=SAFETY_SETTINGS #
        )

        # Iniciar uma sessão de chat COM o histórico devidamente formatado
        chat_session = model.start_chat(history=gemini_formatted_history)

        # Enviar a mensagem atual do usuário (message_text é uma string simples)
        response = chat_session.send_message(message_text)

        return response.text

    except Exception as e:
        print(f"Erro ao enviar mensagem para a API Gemini para o paciente {patient_id}: {e}") #
        return f"Desculpe, ocorreu um erro ao tentar me comunicar com a inteligência artificial: {str(e)}" #
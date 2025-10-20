import os
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
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
    system_instruction_file = os.path.join(os.path.dirname(__file__), 'Co-Pilot_medico.txt')
    if not os.path.exists(system_instruction_file):
        raise FileNotFoundError(f"Arquivo de instrução do sistema não encontrado em: {system_instruction_file}")
    system_instruction_content = open(system_instruction_file, encoding='utf-8').read()
except FileNotFoundError as e:
    print(f"Erro: {e}")
    raise

# Configurações do Modelo
MODEL_NAME = "gemini-flash-latest" # Recomendo 'gemini-1.5-flash-latest' ou 'gemini-1.5-pro-latest'
SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

# Não precisamos mais do dicionário _chat_models se estivermos sempre recriando o chat_session
# Mas se a intenção for ter instâncias persistentes (para manter o estado do modelo internamente),
# então o código que eu forneci anteriormente seria mais adequado.
# Para a sua implementação atual (sem _chat_models), vamos ajustar.

def send_message(patient_id: str, consultation_id: str, message_text: str) -> str:
    """
    Envia uma mensagem para uma sessão de chat Gemini específica da consulta e retorna a resposta.
    O histórico é carregado do patient_db para a consulta específica e formatado para a API Gemini.
    """
    try:
        # 1. Carregar histórico da consulta específica do nosso banco de dados JSON
        # AGORA USAMOS get_consultation_chat_history
        history_from_db = patient_db.get_consultation_chat_history(patient_id, consultation_id)

        # 2. Formatar o histórico para a API Gemini.
        gemini_formatted_history = []
        if history_from_db:
            for message_from_db in history_from_db:
                if "role" in message_from_db and "parts" in message_from_db:
                    # Omitir o campo 'timestamp' e outros campos extras que a API não espera
                    gemini_formatted_history.append({
                        "role": message_from_db["role"],
                        "parts": message_from_db["parts"]
                    })
                else:
                    print(f"Aviso: Mensagem mal formatada no histórico do paciente {patient_id}, consulta {consultation_id} ignorada: {message_from_db}")

        # 3. Instanciar o modelo com a instrução do sistema e configurações
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_instruction_content,
            safety_settings=SAFETY_SETTINGS
        )

        # 4. Iniciar uma sessão de chat COM o histórico da consulta
        # Cada chamada a send_message vai recriar o chat_session com o histórico completo.
        # Isso significa que o modelo SEMPRE terá todo o contexto daquela consulta até o momento.
        chat_session = model.start_chat(history=gemini_formatted_history)

        # 5. Enviar a mensagem atual do usuário
        response = chat_session.send_message(message_text)

        return response.text

    except Exception as e:
        print(f"Erro ao enviar mensagem para a API Gemini para paciente {patient_id}, consulta {consultation_id}: {e}")
        return f"Desculpe, ocorreu um erro ao tentar me comunicar com a inteligência artificial: {str(e)}"
import os
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# Configuração da API Gemini 
try:
    # 1. Carregar a chave de API da variável de ambiente
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("A variável de ambiente GEMINI_API_KEY não foi encontrada. Certifique-se de que ela está definida.")
    genai.configure(api_key=api_key)

except ValueError as e:
    print(f"Erro de configuração da API Gemini: {e}")
    raise  # Re-levanta a exceção para parar a execução se a chave não for encontrada

# Carregar Instrução do Sistema 
try:
    # 2. Carregar a instrução inicial 
    system_instruction_file = './backend/Co-Pilot_medico.txt'
    if not os.path.exists(system_instruction_file):
         raise FileNotFoundError(f"Arquivo de instrução do sistema não encontrado em: {system_instruction_file}")
    system_instruction = open(system_instruction_file, encoding='utf-8').read()

except FileNotFoundError as e:
     print(f"Erro: {e}")
     raise # levanta a exceção de nvo

#Inicialização do Modelo e Chat 
try:
    #Escolher o modelo Gemini
    model_name = "gemini-1.5-flash-latest"

    # Configurações de Segurança (Opcional, ajuste conforme necessário)
    # Bloqueia conteúdo que atinge níveis Médios ou Altos de perigo.
    safety_settings = {
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    }

    # Instanciar o modelo com a instrução do sistema e configurações de segurança
    model = genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system_instruction,
        safety_settings=safety_settings
        # Podemos adicionar generation_config aqui se precisarmos de mudar temperature, max_output_tokens etc.
        # generation_config=genai.types.GenerationConfig(temperature=0.7)
    )

    # Iniciar uma sessão de chat para manter o histórico da conversa
    chat = model.start_chat(history=[]) # Começa com histórico vazio

except Exception as e:
    print(f"Erro ao inicializar o modelo Gemini ou o chat: {e}")
    raise # levanta a exceção novamente

# Função para Interagir com o Chat
def send_message(message_text):
    """
    Envia uma mensagem para a sessão de chat Gemini e retorna a resposta.

    Args:
        message_text (str): A mensagem do usuário.

    Returns:
        str: A resposta de texto do modelo Gemini, ou uma mensagem de erro.
    """
    global chat 
    if not chat:
         return "Erro: A sessão de chat não foi inicializada corretamente."

    try:
        # Enviar a mensagem para a API através da sessão de chat
        # O histórico é gerenciado automaticamente pelo objeto 'chat'
        response = chat.send_message(message_text)

        # Retornar o texto da resposta
        return response.text

    except Exception as e:
        print(f"Erro ao enviar mensagem para a API Gemini: {e}")
        # Retorna uma mensagem de erro para o chamador (o servidor Flask)
        return f"Erro ao comunicar com a IA: {e}"


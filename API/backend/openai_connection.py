import openai

# Carregar a chave de API e mensagens iniciais
API_KEY = open("./backend/api-key.txt", "r").read()
openai.api_key = API_KEY

# Carregar as mensagens iniciais
system_message = open('./backend/Co-Pilot_medico.txt', encoding='utf-8').read()


# Inicializar a conversa com as mensagens de sistema e o dado inicial do paciente
messages = [
    {"role": "system", "content": system_message},
]

# Primeira interação com a API
completion = openai.chat.completions.create(
    model="gpt-4",
    messages=messages,
)

# Função para enviar mensagem para a IA e obter resposta
def send_message_to_ai(message):
    messages.append({"role": "user", "content": message})
    
    completion = openai.chat.completions.create(
        model="gpt-4",
        messages=messages,
    )
    
    response = completion.choices[0].message.content
    messages.append({"role": "assistant", "content": response})
    
    return response
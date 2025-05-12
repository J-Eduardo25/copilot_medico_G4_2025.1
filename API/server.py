import sys
import os
import json

# Removido: import openai

from flask import Flask, request, jsonify
from flask_cors import CORS
# Modificado: Importa o novo script de conexão com o Gemini
from backend import gemini_connection # Assume que gemini_connection.py está em backend/
from backend import pdf_reader
from backend import text_filter

app = Flask(__name__)
CORS(app)  # Enable CORS



#A FUNÇÃO ABAIXO DE EXTRAIR OS DADOS DO PRONTUÁRIO AMPLIMED NÃO ESTÁ FUNCIONANDO

@app.route('/api/extracted-data', methods=['POST'])
def receive_extracted_data():
    try:
        # 1. Receber os dados do front-end
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "Nenhum dado recebido"}), 400

        # 2. Preparar o texto dos dados do paciente para enviar para a IA
        formatted_patient_data = "Dados do paciente:\n"
        if isinstance(data, list): # Checa se data é uma lista como esperado
             for item in data:
                  # Assume que cada item tem 'role' e 'text'
                  if isinstance(item, dict) and 'role' in item and 'text' in item:
                       formatted_patient_data += f"{item['role']}: {item['text']}\n"
                  else:
                       print(f"Item de dado ignorado por formato inválido: {item}")
        else:
             print(f"Formato de dado inesperado recebido: {type(data)}")
             formatted_patient_data += str(data) # Tentativa genérica

   
        print(f"\nEnviando para Gemini:\n{formatted_patient_data}") 
        ai_response = gemini_connection.send_message(formatted_patient_data)

        # 4. Retornar a resposta da IA para o front-end
        return jsonify({
            "status": "success",
            "message": "Dados processados com sucesso pela IA Gemini",
            "ai_response": ai_response # A resposta já é uma string
        }), 200

    except Exception as e:
        # Captura erros gerais ou erros levantados pelo gemini_connection
        print(f"Erro no servidor ao processar dados: {e}")
        # Tenta obter a stack trace para mais detalhes no log do servidor
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Erro interno do servidor: {e}"}), 500
    

# * NOVO ENDPOINT PARA O CHAT *
@app.route('/api/chat', methods=['POST'])
def handle_chat_message():
    
    #Recebe uma mensagem de chat do frontend, envia pra IA e retorna a resposta
    try:
        # 1. Obter a mensagem da requisição JSON
        data = request.json
        if not data or 'message' not in data:
            print("Erro: Requisição para /api/chat sem 'message' no JSON.")
            return jsonify({"status": "error", "message": "Requisição inválida. Campo 'message' não encontrado."}), 400

        user_message = data['message']
        print(f"\nMensagem recebida em /api/chat: {user_message}") # Log

        # 2. Enviar a mensagem para a IA usando a função já existente
        #    A sessão de chat (histórico) é gerenciada dentro de gemini_connection
        user_message = text_filter.remover_nomes(user_message)
        # print(user_message)
        ai_response_text = gemini_connection.send_message(user_message)


        # 3. Retornar a resposta da IA para o frontend
        return jsonify({
            "status": "success",
            "ai_response": ai_response_text
        }), 200

    except Exception as e:
        # erros gerais
        print(f"Erro no endpoint /api/chat: {e}")
        import traceback
        traceback.print_exc()
        # Retorna erro
        return jsonify({"status": "error", "message": f"Erro interno do servidor ao processar chat: {e}"}), 500


@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    try:
        if 'pdf' not in request.files:
            return jsonify({"status": "error", "message": "Nenhum arquivo enviado."}), 400

        file = request.files['pdf']
        if file.filename == '':
            return jsonify({"status": "error", "message": "Nome de arquivo vazio."}), 400

        # Extrair texto do PDF
        extracted_text = pdf_reader.extract_text_from_pdf(file)
        # print(f"Texto extraído do PDF:\n{extracted_text}")

        if not extracted_text.strip():
            return jsonify({"status": "error", "message": "Texto extraído está vazio."}), 400

        # Enviar esse texto como mensagem para a IA (como em /api/chat)
        extracted_text = text_filter.remover_nomes(extracted_text)
        # print(extracted_text)
        ai_response_text = gemini_connection.send_message(extracted_text)

        # Retornar a resposta da IA
        return jsonify({
            "status": "success",
            "message": "Texto extraído e enviado para a IA com sucesso.",
            "extracted_text": extracted_text,
            "ai_response": ai_response_text
        }), 200

    except Exception as e:
        print(f"Erro ao processar upload de PDF: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Erro interno ao processar o PDF: {e}"}), 500

if __name__ == '__main__':

    print("Servidor Flask com Gemini iniciado.")
    print("Certifique-se de que a variável de ambiente GEMINI_API_KEY está definida.")
    print("Aguardando conexões na porta 3001...")
    # host='0.0.0.0' permite conexões de outras máquinas na rede
    # debug=True enquanto está em desenvolvimento
    app.run(host='0.0.0.0', port=3001, debug=True)

# ----- Fim de server.py -----
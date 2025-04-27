import sys
import os
import json

import openai

from flask import Flask, request, jsonify
from flask_cors import CORS
from backend import openai_connection  # Importa o script de conexão com a OpenAI

app = Flask(__name__)
CORS(app)  # Enable CORS to allow requests from your React app

@app.route('/api/extracted-data', methods=['POST'])
def receive_extracted_data():
    try:
        # Receber os dados do front-end
        data = request.json
        
        # Imprimir dados recebidos
        # print("Dados recebidos do front-end:")
        # print(json.dumps(data, indent=2, ensure_ascii=False))
        
        # Preparar o texto para enviar para a IA
        formatted_patient_data = "Dados do paciente:\n"
        for item in data:
            formatted_patient_data += f"{item['role']}: {item['text']}\n"
        
        # Adicionar os dados do paciente à conversa
        openai_connection.messages.append({"role": "user", "content": formatted_patient_data})
        
        # Obter resposta da IA
        completion = openai.chat.completions.create(
            model="gpt-4",
            messages=openai_connection.messages,
        )
        
        # Obter e imprimir a resposta
        response = completion.choices[0].message.content
        # print("\nResposta da IA:")
        # print(response)
        
        
        
        # Retornar a resposta da IA para o front-end (opcional)
        return jsonify({
            "status": "success", 
            "message": "Dados recebidos com sucesso", 
            "ai_response": response
        }), 200
    
    except Exception as e:
        print(f"Erro ao processar dados: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == '__main__':
    print("Servidor iniciado. Aguardando conexões...")
    app.run(host='0.0.0.0', port=3001, debug=True)